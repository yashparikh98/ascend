import type { Token } from "../types/token";

export type AssetCategory =
  | "stocks"
  | "crypto"
  | "pre-ipo"
  | "index"
  | "commodities";

export interface Asset extends Token {
  category: AssetCategory;
  ticker: string;
  change24h?: number;
  price?: number;
}

export const STOCKS: Asset[] = [
  {
    symbol: "NVDAx",
    name: "NVIDIA Corporation",
    mint: "Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh",
    decimals: 9,
    ticker: "NVDA",
    category: "stocks",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fxstocks-metadata.backed.fi%2Flogos%2Ftokens%2FNVDAx.png&dpr=2&quality=80",
  },
  {
    symbol: "AAPLx",
    name: "Apple xStock",
    mint: "XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp",
    decimals: 9,
    ticker: "AAPL",
    category: "stocks",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fxstocks-metadata.backed.fi%2Flogos%2Ftokens%2FAAPLx.png&dpr=2&quality=80",
  },
  {
    symbol: "AMZNx",
    name: "Amazon.com xStock",
    mint: "Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg",
    decimals: 9,
    ticker: "AMZN",
    category: "stocks",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fxstocks-metadata.backed.fi%2Flogos%2Ftokens%2FAMZNx.png&dpr=2&quality=80",
  },
  {
    symbol: "TSLAx",
    name: "Tesla xStock",
    mint: "XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB",
    decimals: 9,
    ticker: "TSLA",
    category: "stocks",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fxstocks-metadata.backed.fi%2Flogos%2Ftokens%2FTSLAx.png&dpr=2&quality=80",
  },
  {
    symbol: "GOOGLx",
    name: "Alphabet xStock",
    mint: "XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN",
    decimals: 9,
    ticker: "GOOGL",
    category: "stocks",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fxstocks-metadata.backed.fi%2Flogos%2Ftokens%2FGOOGLx.png&dpr=2&quality=80",
  },
  {
    symbol: "METAx",
    name: "Meta xStock",
    mint: "Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu",
    decimals: 9,
    ticker: "META",
    category: "stocks",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fxstocks-metadata.backed.fi%2Flogos%2Ftokens%2FMETAx.png&dpr=2&quality=80",
  },
  {
    symbol: "MSFTx",
    name: "Microsoft xStock",
    mint: "XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX",
    decimals: 9,
    ticker: "MSFT",
    category: "stocks",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fxstocks-metadata.backed.fi%2Flogos%2Ftokens%2FMSFTx.png&dpr=2&quality=80",
  },
];

export const CRYPTO: Asset[] = [
  {
    symbol: "SOL",
    name: "Solana",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9,
    ticker: "SOL",
    category: "crypto",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2FSo11111111111111111111111111111111111111112%2Flogo.png&dpr=2&quality=80",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    mint: "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh",
    decimals: 8,
    ticker: "BTC",
    category: "crypto",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2F3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh%2Flogo.png&dpr=2&quality=80",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    mint: "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs",
    decimals: 8,
    ticker: "ETH",
    category: "crypto",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fraw.githubusercontent.com%2Fsolana-labs%2Ftoken-list%2Fmain%2Fassets%2Fmainnet%2F7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs%2Flogo.png&dpr=2&quality=80",
  },
];

export const PRE_IPO: Asset[] = [
  {
    symbol: "xSPACEX",
    name: "SpaceX",
    mint: "PreANxuXjsy2pvisWWMNB6YaJNzr7681wJJr2rHsfTh",
    decimals: 9,
    ticker: "SPACEX",
    category: "pre-ipo",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fgateway.pinata.cloud%2Fipfs%2FQmXp8Q1HjbBcqFC5dcBAXJKoRsnX41Xa4KFR7D6dmQkf73&dpr=2&quality=80",
  },
  {
    symbol: "xOPENAI",
    name: "OpenAI",
    mint: "PreweJYECqtQwBtpxHL171nL2K6umo692gTm7Q3rpgF",
    decimals: 9,
    ticker: "OPENAI",
    category: "pre-ipo",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fwww.prestocks.com%2Flogos%2Fopenai.png%3Fcachebust%3D1&dpr=2&quality=80",
  },
];

export const INDICES: Asset[] = [
  {
    symbol: "xSPY",
    name: "S&P 500 ETF",
    mint: "SPY500MintAddress111111111111111111111111111",
    decimals: 9,
    ticker: "SPY",
    category: "index",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fxstocks-metadata.backed.fi%2Flogos%2Ftokens%2FSPYx.png&dpr=2&quality=80",
  },
  {
    symbol: "xQQQ",
    name: "Nasdaq 100 ETF",
    mint: "QQQNasdaqMintAddress1111111111111111111111111",
    decimals: 9,
    ticker: "QQQ",
    category: "index",
  },
  {
    symbol: "xDIA",
    name: "Dow Jones ETF",
    mint: "DIADowJonesMintAddress11111111111111111111111",
    decimals: 9,
    ticker: "DIA",
    category: "index",
  },
];

export const COMMODITIES: Asset[] = [
  {
    symbol: "xGLD",
    name: "Gold",
    mint: "hWfiw4mcxT8rnNFkk6fsCQSxoxgZ9yVhB6tyeVcondo",
    decimals: 9,
    ticker: "GLD",
    category: "commodities",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fxstocks-metadata.backed.fi%2Flogos%2Ftokens%2FGLDx.png&dpr=2&quality=80",
  },
  {
    symbol: "xSLV",
    name: "Silver",
    mint: "iy11ytbSGcUnrjE6Lfv78TFqxKyUESfku1FugS9ondo",
    decimals: 9,
    ticker: "SLV",
    logoURI:
      "https://wsrv.nl/?w=32&h=32&url=https%3A%2F%2Fremora-public.s3.us-east-2.amazonaws.com%2Flogos%2FSLVr.svg&dpr=2&quality=80",
    category: "commodities",
  },
];

export const ALL_ASSETS: Asset[] = [
  ...STOCKS,
  ...CRYPTO,
  ...PRE_IPO,
  ...INDICES,
  ...COMMODITIES,
];

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
  stocks: "US Stocks",
  crypto: "Crypto",
  "pre-ipo": "Pre-IPO",
  index: "Indices",
  commodities: "Commodities",
};

export function getAssetsByCategory(category: AssetCategory): Asset[] {
  return ALL_ASSETS.filter((asset) => asset.category === category);
}

export function getAssetByMint(mint: string): Asset | undefined {
  return ALL_ASSETS.find((asset) => asset.mint === mint);
}

export function getAssetBySymbol(symbol: string): Asset | undefined {
  return ALL_ASSETS.find((asset) => asset.symbol === symbol);
}

export function searchAssets(query: string): Asset[] {
  const q = query.toLowerCase();
  return ALL_ASSETS.filter(
    (asset) =>
      asset.symbol.toLowerCase().includes(q) ||
      asset.name.toLowerCase().includes(q) ||
      asset.ticker.toLowerCase().includes(q)
  );
}
