export type Asset = {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  disabled?: boolean;
  note?: string;
};

// TODO: Replace placeholder mints for stock tokens with real token addresses.
export const SUPPORTED_ASSETS: Asset[] = [
  {
    symbol: "USDC",
    name: "USD Coin",
    mint: "EPjFWdd5AufqSSqeM2q2nG8maJBPV7ryjVgDQJ2Dh7eU",
    decimals: 6
  },
  {
    symbol: "SOL",
    name: "Solana",
    mint: "So11111111111111111111111111111111111111112",
    decimals: 9
  },
  {
    symbol: "NVDAx",
    name: "Tokenized NVDA",
    mint: "REPLACE_WITH_NVDAx_MINT",
    decimals: 6,
    disabled: true,
    note: "Update mint for live swaps"
  },
  {
    symbol: "AMZNx",
    name: "Tokenized AMZN",
    mint: "REPLACE_WITH_AMZNx_MINT",
    decimals: 6,
    disabled: true,
    note: "Update mint for live swaps"
  },
  {
    symbol: "MAG7",
    name: "MAG 7 Index",
    mint: "REPLACE_WITH_MAG7_MINT",
    decimals: 6,
    disabled: true,
    note: "Update mint for live swaps"
  }
];
