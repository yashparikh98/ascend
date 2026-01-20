export interface Token {
  symbol: string;
  name: string;
  mint: string;
  decimals: number;
  logoURI?: string;
}

export interface XStockToken extends Token {
  underlyingTicker: string;
}

export type TokenBalances = Record<
  string,
  {
    mint: string;
    amount: string;
    uiAmount: number;
    decimals: number;
  }
>;
