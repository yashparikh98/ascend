"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from "@solana/spl-token";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import type { TokenBalances } from "../types/token";
import { SOL } from "../config/tokens";

function toUiAmount(tokenAmount: any): number {
  // tokenAmount: { amount, decimals, uiAmount, uiAmountString }
  const ui = tokenAmount?.uiAmount;
  if (typeof ui === "number" && Number.isFinite(ui)) return ui;

  const uiStr = tokenAmount?.uiAmountString;
  if (typeof uiStr === "string") {
    const n = Number(uiStr);
    if (Number.isFinite(n)) return n;
  }

  const raw = tokenAmount?.amount;
  const decimals = Number(tokenAmount?.decimals ?? 0);
  const amt = Number(raw);
  if (Number.isFinite(amt) && Number.isFinite(decimals)) {
    return amt / Math.pow(10, decimals);
  }

  return 0;
}

function addToBalances(
  balances: TokenBalances,
  mint: string,
  rawAmount: string | number | bigint,
  uiAmount: number,
  decimals: number
) {
  const prev = balances[mint];

  // Sum raw amount using BigInt
  const prevRaw = prev?.amount ? BigInt(prev.amount) : 0n;
  const addRaw =
    typeof rawAmount === "bigint"
      ? rawAmount
      : BigInt(String(rawAmount ?? "0"));
  const nextRaw = prevRaw + addRaw;

  // Sum uiAmount as number (good enough for UI)
  const prevUi = typeof prev?.uiAmount === "number" ? prev.uiAmount : 0;
  const nextUi = prevUi + (Number.isFinite(uiAmount) ? uiAmount : 0);

  balances[mint] = {
    mint,
    amount: nextRaw.toString(),
    uiAmount: nextUi,
    decimals: prev?.decimals ?? decimals ?? 0,
  };
}

export function useTokenBalances() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  return useQuery<TokenBalances>({
    queryKey: ["tokenBalances", publicKey?.toBase58(), connected],
    enabled: !!publicKey && connected,
    staleTime: 10_000,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
    retry: 3,

    queryFn: async () => {
      if (!publicKey) return {};

      const balances: TokenBalances = {};

      try {
        // ---- SOL ----
        const solLamports = await connection.getBalance(publicKey);
        addToBalances(
          balances,
          SOL.mint,
          BigInt(solLamports),
          solLamports / LAMPORTS_PER_SOL,
          9
        );

        // ---- SPL Token (Token Program) ----
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
          publicKey,
          {
            programId: TOKEN_PROGRAM_ID,
          }
        );

        for (const { account } of tokenAccounts.value) {
          const info: any = account?.data?.parsed?.info;
          const mint = info?.mint;
          const tokenAmount = info?.tokenAmount;
          if (!mint || !tokenAmount) continue;

          const ui = toUiAmount(tokenAmount);
          const raw = tokenAmount.amount ?? "0";
          const decimals = Number(tokenAmount.decimals ?? 0);

          addToBalances(balances, mint, raw, ui, decimals);
        }

        // ---- SPL Token 2022 ----
        const token2022Accounts =
          await connection.getParsedTokenAccountsByOwner(publicKey, {
            programId: TOKEN_2022_PROGRAM_ID,
          });

        for (const { account } of token2022Accounts.value) {
          const info: any = account?.data?.parsed?.info;
          const mint = info?.mint;
          const tokenAmount = info?.tokenAmount;
          if (!mint || !tokenAmount) continue;

          const ui = toUiAmount(tokenAmount);
          const raw = tokenAmount.amount ?? "0";
          const decimals = Number(tokenAmount.decimals ?? 0);

          addToBalances(balances, mint, raw, ui, decimals);
        }
      } catch (e) {
        console.error("Error fetching balances:", e);
      }

      return balances;
    },
  });
}

export function useTokenBalance(mint: string) {
  const { data: balances } = useTokenBalances();
  return balances?.[mint]?.uiAmount ?? 0;
}
