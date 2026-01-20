import type { XStockToken } from "../types/token";

export const XSTOCK_TOKENS: XStockToken[] = [
  {
    symbol: "xNVDA",
    name: "NVIDIA Corporation",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    decimals: 9,
    underlyingTicker: "NVDA",
    logoURI: "/tokens/nvda.png"
  },
  {
    symbol: "xAAPL",
    name: "Apple Inc.",
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 9,
    underlyingTicker: "AAPL",
    logoURI: "/tokens/aapl.png"
  },
  {
    symbol: "xTSLA",
    name: "Tesla, Inc.",
    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    decimals: 9,
    underlyingTicker: "TSLA",
    logoURI: "/tokens/tsla.png"
  },
  {
    symbol: "xMSFT",
    name: "Microsoft Corporation",
    mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
    decimals: 9,
    underlyingTicker: "MSFT",
    logoURI: "/tokens/msft.png"
  },
  {
    symbol: "xAMZN",
    name: "Amazon.com, Inc.",
    mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
    decimals: 9,
    underlyingTicker: "AMZN",
    logoURI: "/tokens/amzn.png"
  },
  {
    symbol: "xGOOGL",
    name: "Alphabet Inc.",
    mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
    decimals: 9,
    underlyingTicker: "GOOGL",
    logoURI: "/tokens/googl.png"
  },
  {
    symbol: "xMETA",
    name: "Meta Platforms, Inc.",
    mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
    decimals: 9,
    underlyingTicker: "META",
    logoURI: "/tokens/meta.png"
  },
  {
    symbol: "xCOIN",
    name: "Coinbase Global, Inc.",
    mint: "CbNYA9n3927sKrDffRomi6jkJn2ULL5NWP9mpt3hprvL",
    decimals: 9,
    underlyingTicker: "COIN",
    logoURI: "/tokens/coin.png"
  }
];

export function getXStockByMint(mint: string): XStockToken | undefined {
  return XSTOCK_TOKENS.find((t) => t.mint === mint);
}

export function getXStockBySymbol(symbol: string): XStockToken | undefined {
  return XSTOCK_TOKENS.find((t) => t.symbol === symbol);
}
