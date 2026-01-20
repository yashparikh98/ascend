"use client";

import { useCallback, useState } from "react";
import { VersionedTransaction } from "@solana/web3.js";

export type DcaStatus = "idle" | "submitting" | "success" | "error";

export type CreateRecurringTimeOrderParams = {
  user: string; // wallet pubkey base58
  inputMint: string;
  outputMint: string;
  // Total amount deposited now (raw, before decimals)
  inAmount: number;
  // Total number of orders (>=2)
  numberOfOrders: number;
  // Seconds between each order (e.g. 86400)
  interval: number;
  // optional (docs show these fields)
  minPrice?: number | null;
  maxPrice?: number | null;
  startAt?: number | null;
};

const LITE_CREATE = "https://lite-api.jup.ag/recurring/v1/createOrder";
const LITE_EXECUTE = "https://lite-api.jup.ag/recurring/v1/execute";

export function useJupiterRecurring() {
  const [status, setStatus] = useState<DcaStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<any>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setResponse(null);
  }, []);

  /**
   * Creates a recurring order transaction via Jupiter, asks the wallet to sign it,
   * then submits it via Jupiter /execute (no RPC infra needed).
   *
   * You must pass signTransaction from wallet-adapter and a fetchable base58 user key.
   */
  const createAndExecuteTimeOrder = useCallback(
    async ({
      params,
      signTransaction,
    }: {
      params: CreateRecurringTimeOrderParams;
      signTransaction: (
        tx: VersionedTransaction
      ) => Promise<VersionedTransaction>;
    }) => {
      try {
        setStatus("submitting");
        setError(null);
        setResponse(null);

        // 1) Create order (Jupiter builds tx for you) :contentReference[oaicite:6]{index=6}
        const createRes = await fetch(LITE_CREATE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user: params.user,
            inputMint: params.inputMint,
            outputMint: params.outputMint,
            params: {
              time: {
                inAmount: params.inAmount,
                numberOfOrders: params.numberOfOrders,
                interval: params.interval,
                minPrice: params.minPrice ?? null,
                maxPrice: params.maxPrice ?? null,
                startAt: params.startAt ?? null,
              },
            },
          }),
        });

        if (!createRes.ok) {
          const text = await createRes.text().catch(() => "");
          throw new Error(text || "createOrder failed");
        }

        const createData = await createRes.json();
        const { transaction, requestId } = createData;

        if (!transaction || !requestId) {
          throw new Error(
            "Invalid createOrder response: missing transaction/requestId"
          );
        }

        // 2) Deserialize + wallet signs (docs show VersionedTransaction flow) :contentReference[oaicite:7]{index=7}
        const tx = VersionedTransaction.deserialize(
          Buffer.from(transaction, "base64")
        );
        const signedTx = await signTransaction(tx);
        const signedTransaction = Buffer.from(signedTx.serialize()).toString(
          "base64"
        );

        // 3) Execute (Jupiter submits tx for you) :contentReference[oaicite:8]{index=8}
        const execRes = await fetch(LITE_EXECUTE, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            signedTransaction,
            requestId,
          }),
        });

        if (!execRes.ok) {
          const text = await execRes.text().catch(() => "");
          throw new Error(text || "execute failed");
        }

        const execData = await execRes.json();
        setResponse({ create: createData, execute: execData });
        setStatus("success");
        return execData;
      } catch (e: any) {
        setStatus("error");
        setError(e?.message ?? "Recurring order error");
        return null;
      }
    },
    []
  );

  return { status, error, response, reset, createAndExecuteTimeOrder };
}
