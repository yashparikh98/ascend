import {
  getAssetByMint,
  STOCKS,
  CRYPTO,
  INDICES,
  COMMODITIES,
  PRE_IPO,
} from "./assets";

export type BasketRisk = "low" | "medium" | "high";
export type BasketItem = { mint: string; weight: number };
export type Basket = {
  id: string;
  name: string;
  description: string;
  risk: BasketRisk;
  tags?: string[];
  featured?: boolean;
  disabled?: boolean;
  disabledReason?: string;
  items: BasketItem[];
};

const bySymbol = (arr: { symbol: string; mint: string }[]) =>
  Object.fromEntries(arr.map((a) => [a.symbol, a.mint])) as Record<
    string,
    string
  >;

const S = bySymbol(STOCKS);
const C = bySymbol(CRYPTO);
const I = bySymbol(INDICES);
const M = bySymbol(COMMODITIES);
const P = bySymbol(PRE_IPO);

export const BASKETS: Basket[] = [
  {
    id: "mag7",
    name: "MAG 7",
    description: "Equal-weight mega-cap tech leaders",
    risk: "medium",
    featured: true,
    tags: ["Stocks", "Equal-weight"],
    items: [
      { mint: S["NVDAx"], weight: 1 },
      { mint: S["AAPLx"], weight: 1 },
      { mint: S["MSFTx"], weight: 1 },
      { mint: S["AMZNx"], weight: 1 },
      { mint: S["GOOGLx"], weight: 1 },
      { mint: S["METAx"], weight: 1 },
      { mint: S["TSLAx"], weight: 1 },
    ],
  },

  {
    id: "ai-chips",
    name: "AI + Chips",
    description: "AI leaders + infra exposure",
    risk: "high",
    featured: true,
    tags: ["Stocks", "AI"],
    items: [
      { mint: S["NVDAx"], weight: 45 },
      { mint: S["MSFTx"], weight: 35 },
      { mint: C["SOL"], weight: 20 },
    ],
  },

  {
    id: "crypto-blue",
    name: "Crypto Blue Chips",
    description: "BTC + ETH + SOL (core majors)",
    risk: "high",
    featured: true,
    tags: ["Crypto", "Core"],
    items: [
      { mint: C["BTC"], weight: 40 },
      { mint: C["ETH"], weight: 35 },
      { mint: C["SOL"], weight: 25 },
    ],
  },

  {
    id: "balanced-growth",
    name: "Balanced Growth",
    description: "Stocks index + crypto + gold hedge",
    risk: "medium",
    featured: true,
    tags: ["Mixed", "Hedge"],
    items: [
      { mint: I["xSPY"], weight: 50 },
      { mint: C["BTC"], weight: 30 },
      { mint: M["xGLD"], weight: 20 },
    ],
    // Note: your index/gold mints are placeholders right now
    disabled: true,
    disabledReason:
      "Indices/commodities mints are placeholders — enable once live.",
  },

  {
    id: "coinbase-tech",
    name: "Tech + Crypto Proxy",
    description: "Tech leaders + COIN + SOL",
    risk: "high",
    tags: ["Stocks", "Mixed"],
    items: [
      { mint: S["NVDAx"], weight: 30 },
      { mint: S["MSFTx"], weight: 20 },
      { mint: S["METAx"], weight: 20 },
      { mint: S["COINx"], weight: 15 },
      { mint: C["SOL"], weight: 15 },
    ],
  },

  {
    id: "pre-ipo-future",
    name: "Pre-IPO Future",
    description: "SpaceX + Stripe + OpenAI (coming soon)",
    risk: "high",
    tags: ["Pre-IPO"],
    disabled: true,
    disabledReason: "Pre-IPO mints are placeholders — enable once live.",
    items: [
      { mint: P["xSPACEX"], weight: 1 },
      { mint: P["xOPENAI"], weight: 1 },
    ],
  },
];

export function basketDisplayItems(basket: Basket) {
  const sum = basket.items.reduce((s, i) => s + i.weight, 0) || 1;

  return basket.items.map((item) => {
    const asset = item?.mint ? getAssetByMint(item.mint) : undefined;
    const pct = (item.weight / sum) * 100;
    const fallbackSymbol = item?.mint ? `${item.mint.slice(0, 4)}…` : "Asset";

    return {
      ...item,
      symbol: asset?.symbol ?? fallbackSymbol,
      name: asset?.name ?? "Unknown asset",
      ticker: asset?.ticker,
      category: asset?.category,
      decimals: asset?.decimals ?? 6,
      weightPct: pct,
    };
  });
}
