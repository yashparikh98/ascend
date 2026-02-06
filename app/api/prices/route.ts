"use server";

import { NextResponse } from "next/server";

const DEXSCREENER_CHAIN_ID = "solana";
const DEXSCREENER_CHUNK_SIZE = 30;

type DexPair = {
  pairAddress?: string;
  priceUsd?: string | number;
  priceNative?: string | number;
  baseToken?: {
    address?: string;
  };
  quoteToken?: {
    address?: string;
  };
  liquidity?: {
    usd?: string | number;
  };
  volume?: {
    h24?: string | number;
  };
};

type BestQuote = {
  priceUsd: number;
  pairAddress: string;
  liquidityUsd: number;
  volume24h: number;
};

function toFiniteNumber(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

function isBetterQuote(current: BestQuote | undefined, candidate: BestQuote) {
  if (!current) return true;
  if (candidate.liquidityUsd !== current.liquidityUsd) {
    return candidate.liquidityUsd > current.liquidityUsd;
  }
  if (candidate.volume24h !== current.volume24h) {
    return candidate.volume24h > current.volume24h;
  }
  return false;
}

function deriveTokenPriceUsd(pair: DexPair, mint: string): number | null {
  const base = pair.baseToken?.address;
  const quote = pair.quoteToken?.address;
  const baseUsd = toFiniteNumber(pair.priceUsd);

  if (!baseUsd || baseUsd <= 0) return null;
  if (base === mint) return baseUsd;
  if (quote !== mint) return null;

  const baseInQuote = toFiniteNumber(pair.priceNative);
  if (!baseInQuote || baseInQuote <= 0) return null;

  const quoteUsd = baseUsd / baseInQuote;
  if (!Number.isFinite(quoteUsd) || quoteUsd <= 0) return null;
  return quoteUsd;
}

async function fetchPairsForMints(mints: string[]) {
  const url = `https://api.dexscreener.com/tokens/v1/${DEXSCREENER_CHAIN_ID}/${mints.join(",")}`;

  const response = await fetch(url, {
    cache: "no-store",
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`DexScreener request failed (${response.status})`);
  }

  const data = await response.json();
  return Array.isArray(data) ? (data as DexPair[]) : [];
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const mintsParam = url.searchParams.get("mints") ?? "";
  const mints = Array.from(
    new Set(
      mintsParam
        .split(",")
        .map((mint) => mint.trim())
        .filter(Boolean)
    )
  );

  if (mints.length === 0) {
    return NextResponse.json(
      { error: "mints query param is required" },
      { status: 400 }
    );
  }

  // Defensive cap to avoid oversized query strings / accidental abuse.
  const requestedMints = mints.slice(0, 240);
  const requestedMintSet = new Set(requestedMints);

  const chunks = chunk(requestedMints, DEXSCREENER_CHUNK_SIZE);
  const pairResults = await Promise.allSettled(
    chunks.map((mintChunk) => fetchPairsForMints(mintChunk))
  );

  const bestQuotes: Record<string, BestQuote> = {};
  let successfulChunks = 0;

  for (const result of pairResults) {
    if (result.status !== "fulfilled") continue;
    successfulChunks += 1;

    for (const pair of result.value) {
      const liquidityUsd = toFiniteNumber(pair.liquidity?.usd) ?? 0;
      const volume24h = toFiniteNumber(pair.volume?.h24) ?? 0;
      const pairAddress = pair.pairAddress ?? "";
      if (!pairAddress) continue;

      const candidateMints = [pair.baseToken?.address, pair.quoteToken?.address]
        .filter((address): address is string => !!address)
        .filter((address) => requestedMintSet.has(address));

      for (const mint of candidateMints) {
        const priceUsd = deriveTokenPriceUsd(pair, mint);
        if (!priceUsd) continue;

        const candidate: BestQuote = {
          priceUsd,
          pairAddress,
          liquidityUsd,
          volume24h,
        };

        if (isBetterQuote(bestQuotes[mint], candidate)) {
          bestQuotes[mint] = candidate;
        }
      }
    }
  }

  if (successfulChunks === 0) {
    return NextResponse.json(
      { error: "Failed to fetch token prices from DexScreener" },
      { status: 502 }
    );
  }

  const prices: Record<string, number> = {};
  const meta: Record<string, { pairAddress: string; liquidityUsd: number }> =
    {};

  for (const mint of requestedMints) {
    const quote = bestQuotes[mint];
    if (!quote) continue;
    prices[mint] = quote.priceUsd;
    meta[mint] = {
      pairAddress: quote.pairAddress,
      liquidityUsd: quote.liquidityUsd,
    };
  }

  return NextResponse.json({
    source: "dexscreener",
    chainId: DEXSCREENER_CHAIN_ID,
    prices,
    meta,
    timestamp: Date.now(),
  });
}
