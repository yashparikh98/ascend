"use client";

import { useState, useCallback } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useQueryClient } from "@tanstack/react-query";
import { VersionedTransaction } from "@solana/web3.js";
import { jupiterApi } from "../lib/jupiter/client";

type SwapStatus = "idle" | "preparing" | "signing" | "confirming" | "success" | "error";

interface SwapParams {
  inputMint: string;
  outputMint: string;
  amount: number; // smallest unit
  slippageBps: number;
}

interface UseJupiterSwapReturn {
  swap: (params: SwapParams) => Promise<string | null>;
  status: SwapStatus;
  error: string | null;
  reset: () => void;
}

export function useJupiterSwap(): UseJupiterSwapReturn {
  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<SwapStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  const swap = useCallback(
    async (params: SwapParams): Promise<string | null> => {
      if (!publicKey || !signTransaction) {
        setError("Wallet not connected");
        setStatus("error");
        return null;
      }

      try {
        setStatus("preparing");
        setError(null);

        const freshQuote = await jupiterApi.quoteGet({
          inputMint: params.inputMint,
          outputMint: params.outputMint,
          amount: params.amount,
          slippageBps: params.slippageBps
        });

        if (!freshQuote) {
          throw new Error("Failed to get quote");
        }

        const swapResponse = await jupiterApi.swapPost({
          swapRequest: {
            quoteResponse: freshQuote,
            userPublicKey: publicKey.toBase58(),
            dynamicComputeUnitLimit: true
          }
        });

        const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, "base64");
        const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

        setStatus("signing");
        const signedTransaction = await signTransaction(transaction);

        setStatus("confirming");
        const rawTransaction = signedTransaction.serialize();
        const txid = await connection.sendRawTransaction(rawTransaction, {
          skipPreflight: true,
          maxRetries: 2
        });

        const latestBlockhash = await connection.getLatestBlockhash("confirmed");
        const confirmation = await connection.confirmTransaction(
          {
            signature: txid,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight
          },
          "confirmed"
        );

        if (confirmation.value.err) {
          throw new Error("Transaction failed on chain");
        }

        setStatus("success");
        queryClient.invalidateQueries({ queryKey: ["tokenBalances"] });
        return txid;
      } catch (err: any) {
        const errorMessage = err instanceof Error ? err.message : "Swap failed";

        if (errorMessage.includes("block height exceeded")) {
          setError("Transaction expired. Please try again.");
        } else if (errorMessage.includes("insufficient")) {
          setError("Insufficient balance for this swap.");
        } else {
          setError(errorMessage);
        }

        setStatus("error");
        return null;
      }
    },
    [publicKey, signTransaction, connection, queryClient]
  );

  return { swap, status, error, reset };
}
