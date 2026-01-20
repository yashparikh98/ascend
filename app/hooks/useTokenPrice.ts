"use client";

import { useQuery } from "@tanstack/react-query";

const COINGECKO_IDS: Record<string, string> = {
  "So11111111111111111111111111111111111111112": "solana",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "usd-coin",
  "3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh": "bitcoin",
  "7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs": "ethereum"
};

const XSTOCK_TICKERS: Record<string, string> = {
  "9gwTegFJJErDpWJKjPfLr2g2zrE3nL1v5zpwbtsk3c6P": "NVDA",
  HLm32fkK51wSi8TM9DvFmPuKjNbKzPkCTrXPnygsMVUp: "AAPL",
  "3n3LPMZ4PTLpKqTxkHfrAtqdqFKUxzGbrBhi7qKHnipG": "TSLA",
  ANNmJmGxHwUsVRnqfLfbcH3eH1f1YuBDGoMbgeAt9zLP: "MSFT",
  "7VDEsKBXWSjVVaVzqz5vfuU2G5xCXvVRjTHqP9Kjqwn1": "AMZN",
  "67So6HhEkba1cPTJ2KUQGCE2t5M9YnJLCBq4gQ1NyLAn": "GOOGL",
  METADDFL6wWMWEoKTFJwcThTbUmtarRJZjRpzUvkxhr: "META",
  CbNYA9n3927sKrDffRomi6jkJn2ULL5NWP9mpt3hprvL: "COIN",
  // legacy/old mints (keep mapping so prices work on older tokens)
  Xsc9qvGR1efVDFGLrVsmkzv3qi45LTBjeUKSPmx9qEh: "NVDA",
  XsbEhLAtcf6HdfpFZ5xEMdqW8nfAvcsP5bdudRLJzJp: "AAPL",
  Xs3eBt7uRfJX8QUs4suhyU8p2M6DoUDrJyWBa8LLZsg: "AMZN",
  XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB: "TSLA",
  XsCPL9dNWBMvFtTmwcCA5v3xWPSMEBCszbQdiLLq6aN: "GOOGL",
  Xsa62P5mvPszXL1krVUnU5ar38bBSVcWAB6fmPCo5Zu: "META",
  XspzcW1PRtgf6Wj92HCiZdjzKCyFekVD8P5Ueh3dRMX: "MSFT"
};

export function useTokenPrice(mint: string) {
  return useQuery<number | null>({
    queryKey: ["tokenPrice", mint],
    queryFn: async () => {
      if (!mint) return null;
      const geckoId = COINGECKO_IDS[mint];
      if (!geckoId) return null;
      try {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${geckoId}&vs_currencies=usd`
        );
        if (!response.ok) return null;
        const data = await response.json();
        return data[geckoId]?.usd ?? null;
      } catch (error) {
        console.error("Failed to fetch price:", error);
        return null;
      }
    },
    enabled: !!mint,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 1
  });
}

export function useTokenPrices(mints: string[]) {
  return useQuery<Record<string, number>>({
    queryKey: ["tokenPrices", mints.join(",")],
    queryFn: async () => {
      if (mints.length === 0) return {};
      const prices: Record<string, number> = {};

      const geckoIds: string[] = [];
      const mintToGeckoId: Record<string, string> = {};
      const stockTickers: string[] = [];
      const tickerToMint: Record<string, string> = {};

      for (const mint of mints) {
        const geckoId = COINGECKO_IDS[mint];
        if (geckoId) {
          geckoIds.push(geckoId);
          mintToGeckoId[mint] = geckoId;
        }
        const ticker = XSTOCK_TICKERS[mint];
        if (ticker) {
          stockTickers.push(ticker);
          tickerToMint[ticker] = mint;
        }
      }

      if (geckoIds.length > 0) {
        try {
          const response = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${geckoIds.join(",")}&vs_currencies=usd`
          );
          if (response.ok) {
            const data = await response.json();
            for (const mint of mints) {
              const geckoId = mintToGeckoId[mint];
              if (geckoId && data[geckoId]?.usd) {
                prices[mint] = data[geckoId].usd;
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch CoinGecko prices:", error);
        }
      }

      if (stockTickers.length > 0) {
        try {
          const response = await fetch(`/api/prices?symbols=${stockTickers.join(",")}`);
          if (response.ok) {
            const data = await response.json();
            if (stockTickers.length === 1 && data.quote !== undefined) {
              const mint = tickerToMint[stockTickers[0]];
              prices[mint] = data.quote;
            } else {
              for (const ticker of stockTickers) {
                if (data[ticker]?.quote) {
                  const mint = tickerToMint[ticker];
                  prices[mint] = data[ticker].quote;
                }
              }
            }
          }
        } catch (error) {
          console.error("Failed to fetch stock prices:", error);
        }
      }

      return prices;
    },
    enabled: mints.length > 0,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: 1
  });
}
