export function formatUsdPrice(priceUsd: number | null | undefined): string {
  if (!priceUsd || !Number.isFinite(priceUsd) || priceUsd <= 0) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: priceUsd >= 1 ? 2 : 6,
  }).format(priceUsd);
}

export function formatPctChange(change24h: number | null | undefined): string {
  if (typeof change24h !== "number" || !Number.isFinite(change24h)) return "—";
  return `${change24h >= 0 ? "+" : ""}${change24h.toFixed(1)}%`;
}

// Deterministic sparkline so cards stay visually stable across re-renders.
export function buildSparkline(
  seed: string,
  basePriceUsd: number | null | undefined,
  points = 8
): number[] {
  const base =
    typeof basePriceUsd === "number" && Number.isFinite(basePriceUsd) && basePriceUsd > 0
      ? basePriceUsd
      : 100;

  const out: number[] = [];
  let value = base;
  let state = seed
    .split("")
    .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) >>> 0, 2166136261);

  for (let i = 0; i < points; i++) {
    state = (1664525 * state + 1013904223) >>> 0;
    const direction = state % 2 === 0 ? 1 : -1;
    const pct = ((state % 900) + 100) / 10000; // 1%..10%
    value = Math.max(0.000001, value * (1 + direction * pct * 0.08));
    out.push(Number(value.toFixed(2)));
  }

  return out;
}
