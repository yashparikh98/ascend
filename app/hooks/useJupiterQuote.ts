"use client";

import { useQuery } from "@tanstack/react-query";
import type { QuoteResponse } from "@jup-ag/api";
import { jupiterApi } from "../lib/jupiter/client";

interface UseJupiterQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
  decimals: number;
}

export function useJupiterQuote({
  inputMint,
  outputMint,
  amount,
  slippageBps,
  decimals
}: UseJupiterQuoteParams) {
  const amountInSmallestUnit = amount
    ? Math.floor(parseFloat(amount) * Math.pow(10, decimals))
    : 0;

  return useQuery<QuoteResponse | null>({
    queryKey: [
      "jupiterQuote",
      inputMint,
      outputMint,
      amountInSmallestUnit,
      slippageBps
    ],
    queryFn: async () => {
      if (!inputMint || !outputMint || !amount || parseFloat(amount) <= 0) {
        return null;
      }

      try {
        const quote = await jupiterApi.quoteGet({
          inputMint,
          outputMint,
          amount: amountInSmallestUnit,
          slippageBps
        });

        return quote;
      } catch (error) {
        console.error("Failed to fetch quote:", error);
        throw error;
      }
    },
    enabled:
      !!inputMint &&
      !!outputMint &&
      !!amount &&
      parseFloat(amount) > 0 &&
      inputMint !== outputMint,
    staleTime: 10000,
    refetchInterval: 15000,
    retry: 2
  });
}
