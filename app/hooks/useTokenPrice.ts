"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

function normalizeMints(mints: string[]) {
  return Array.from(
    new Set(
      mints
        .map((mint) => mint.trim())
        .filter(Boolean)
    )
  );
}

async function fetchMintPrices(mints: string[]): Promise<Record<string, number>> {
  if (mints.length === 0) return {};

  const response = await fetch(
    `/api/prices?mints=${encodeURIComponent(mints.join(","))}`
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch token prices (${response.status})`);
  }

  const data = await response.json();
  return (data?.prices as Record<string, number>) ?? {};
}

export function useTokenPrice(mint: string) {
  const normalizedMint = mint.trim();

  return useQuery<number | null>({
    queryKey: ["tokenPrice", normalizedMint],
    queryFn: async () => {
      if (!normalizedMint) return null;
      const prices = await fetchMintPrices([normalizedMint]);
      return prices[normalizedMint] ?? null;
    },
    enabled: !!normalizedMint,
    staleTime: 15000,
    refetchInterval: 30000,
    retry: 1
  });
}

export function useTokenPrices(mints: string[]) {
  const normalizedMints = useMemo(() => normalizeMints(mints), [mints]);

  return useQuery<Record<string, number>>({
    queryKey: ["tokenPrices", normalizedMints],
    queryFn: async () => fetchMintPrices(normalizedMints),
    enabled: normalizedMints.length > 0,
    staleTime: 15000,
    refetchInterval: 30000,
    retry: 1
  });
}
