"use server";

import { NextResponse } from "next/server";

// Temporary fallback quotes for xStocks and majors while a real price API
// integration is pending. Extend this map as you add assets.
const FALLBACK_QUOTES: Record<string, number> = {
  NVDA: 134.2,
  AAPL: 192.44,
  MSFT: 421.12,
  AMZN: 186.12,
  META: 488.55,
  TSLA: 182.09,
  GOOGL: 158.1,
  BTC: 68000,
  ETH: 3200,
  SOL: 180,
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const symbolsParam = url.searchParams.get("symbols") ?? "";
  const symbols = symbolsParam
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  // If no symbols passed, return 400
  if (symbols.length === 0) {
    return NextResponse.json(
      { error: "symbols query param is required" },
      { status: 400 }
    );
  }

  // Build response using fallbacks
  const result: Record<string, { quote: number; source: string }> = {};
  symbols.forEach((sym) => {
    const price = FALLBACK_QUOTES[sym];
    if (price !== undefined) {
      result[sym] = { quote: price, source: "fallback" };
    }
  });

  // If only one symbol, support single-object response shape used elsewhere
  if (symbols.length === 1) {
    const sym = symbols[0];
    const found = result[sym];
    if (!found) {
      return NextResponse.json(
        { error: `No price for ${sym}` },
        { status: 404 }
      );
    }
    return NextResponse.json({ quote: found.quote, source: found.source });
  }

  return NextResponse.json(result);
}
