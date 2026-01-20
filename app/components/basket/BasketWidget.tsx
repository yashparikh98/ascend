"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { jupiterApi } from "../../lib/jupiter/client";
import { BASKETS, basketDisplayItems } from "../../config/baskets";
import { USDC } from "../../config/tokens";
import useCurrency from "../../hooks/useCurrency";
import { formatMoney } from "../../lib/format/formatMoney";
import { getAssetByMint } from "../../config/assets";
import { BasketLogo } from "../shared/BasketLogo";
import { useJupiterRecurring } from "../../hooks/useJupiterDca";

const FX = 83;
const SLIPPAGE_BPS = 50;

type Props = {
  onClose: () => void;
  initialBasketId?: string;
};

type QuoteRow = {
  mint: string;
  usd: number;
  smallest: number;
  quote: any;
};

function safeNumber(v: any, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function formatTokenAmountRaw(raw: string | number, decimals: number) {
  const n = typeof raw === "string" ? Number(raw) : raw;
  if (!Number.isFinite(n)) return "—";
  return (n / 10 ** decimals).toLocaleString(undefined, {
    maximumFractionDigits: 6,
  });
}

export default function BasketWidget({ onClose, initialBasketId }: Props) {
  const { currency } = useCurrency();
  const { connection } = useConnection();
  const { publicKey, signAllTransactions, signTransaction, connected } =
    useWallet();

  const [basketId, setBasketId] = useState(initialBasketId ?? BASKETS[0].id);
  const [amount, setAmount] = useState("300");
  const [mode, setMode] = useState<"once" | "dca">("once");

  const [quotes, setQuotes] = useState<QuoteRow[]>([]);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const [executing, setExecuting] = useState(false);
  const [progress, setProgress] = useState<{
    done: number;
    total: number;
    current?: string;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [signatures, setSignatures] = useState<string[]>([]);

  // DCA config
  const [dcaOrders, setDcaOrders] = useState<number>(4);
  const [dcaInterval, setDcaInterval] = useState<number>(604800);
  const [dcaMessages, setDcaMessages] = useState<string[]>([]);
  const [dcaProgress, setDcaProgress] = useState<{
    done: number;
    total: number;
    current?: string;
  } | null>(null);

  const {
    createAndExecuteTimeOrder,
    status: dcaStatus,
    error: dcaError,
    reset: resetDca,
  } = useJupiterRecurring();

  useEffect(() => {
    if (initialBasketId) setBasketId(initialBasketId);
  }, [initialBasketId]);

  const basket = useMemo(
    () => BASKETS.find((b) => b.id === basketId)!,
    [basketId]
  );
  const displayItems = useMemo(() => basketDisplayItems(basket), [basket]);

  const totalUsd = useMemo(() => safeNumber(amount, 0), [amount]);
  const totalDisplay = useMemo(() => {
    return formatMoney({
      usdAmount: totalUsd,
      inrAmount: totalUsd * FX,
      currency,
      fxRate: FX,
    }).primaryText;
  }, [totalUsd, currency]);

  const weightsSum = useMemo(
    () => basket.items.reduce((sum, item) => sum + item.weight, 0),
    [basket.items]
  );

  const allocations = useMemo(() => {
    const total = totalUsd;
    return basket.items.map((item) => {
      const usd = weightsSum > 0 ? (total * item.weight) / weightsSum : 0;
      return {
        mint: item.mint,
        usd, // TOTAL allocated to this asset
        smallest: Math.floor(usd * 10 ** USDC.decimals),
      };
    });
  }, [totalUsd, basket.items, weightsSum]);

  const allocationsByMint = useMemo(() => {
    const m = new Map<string, (typeof allocations)[number]>();
    allocations.forEach((a) => m.set(a.mint, a));
    return m;
  }, [allocations]);

  const perOrderUsd = useMemo(() => {
    // Approx per-asset per-order spend
    const perAssetTotal = totalUsd / Math.max(1, basket.items.length);
    return perAssetTotal / Math.max(1, dcaOrders);
  }, [totalUsd, basket.items.length, dcaOrders]);

  const validation = useMemo(() => {
    if (!connected || !publicKey) return "Connect wallet first.";
    if (totalUsd <= 0) return "Enter an amount.";

    // prevent tiny orders: per-asset total & per-order
    const perAssetTotal = totalUsd / Math.max(1, basket.items.length);
    // if (perAssetTotal < 5)
    //   return "Amount is too small for this basket (increase total).";

    if (mode === "once" && !signAllTransactions)
      return "Wallet must support signAllTransactions for one-click baskets.";

    if (mode === "dca" && !signTransaction)
      return "Wallet must support signTransaction for DCA.";

    // DCA minimums (UX guardrails)
    if (mode === "dca") {
      if (dcaOrders < 2) return "DCA needs at least 2 orders.";
      if (perOrderUsd < 2)
        return "Per-order amount too small. Increase total or reduce number of orders.";
    }

    return null;
  }, [
    connected,
    publicKey,
    signAllTransactions,
    signTransaction,
    totalUsd,
    basket.items.length,
    mode,
    dcaOrders,
    perOrderUsd,
  ]);

  const fetchQuotes = async () => {
    setLoadingQuote(true);
    setError(null);
    setQuotes([]);
    setSignatures([]);
    setProgress(null);
    setDcaMessages([]);
    setDcaProgress(null);

    try {
      const results = await Promise.all(
        allocations.map(async (alloc) => {
          const quote = await jupiterApi.quoteGet({
            inputMint: USDC.mint,
            outputMint: alloc.mint,
            amount: alloc.smallest,
            slippageBps: SLIPPAGE_BPS,
          });
          return { ...alloc, quote } as QuoteRow;
        })
      );

      setQuotes(results);
    } catch (e: any) {
      setError(e?.message ?? "Quote error");
    } finally {
      setLoadingQuote(false);
    }
  };

  const executeOnce = async () => {
    if (validation) {
      setError(validation);
      return;
    }
    if (!publicKey || !connected) return;
    if (!quotes.length) {
      setError("Preview quotes first.");
      return;
    }
    if (!signAllTransactions) {
      setError("Wallet must support signAllTransactions.");
      return;
    }

    setExecuting(true);
    setError(null);
    setSignatures([]);
    setProgress({ done: 0, total: quotes.length });

    try {
      const txs: VersionedTransaction[] = [];
      for (const row of quotes) {
        const isOutputSol =
          row.mint === "So11111111111111111111111111111111111111112";
        const swapRes = await jupiterApi.swapPost({
          swapRequest: {
            quoteResponse: row.quote,
            userPublicKey: publicKey.toBase58(),
            wrapAndUnwrapSol: isOutputSol,
          },
        });

        if (!swapRes?.swapTransaction) {
          throw new Error("Swap build failed (missing swapTransaction).");
        }

        const tx = VersionedTransaction.deserialize(
          Buffer.from(swapRes.swapTransaction, "base64")
        );
        txs.push(tx);
      }

      const signed = await signAllTransactions(txs);

      const sigs: string[] = [];
      for (let i = 0; i < signed.length; i++) {
        const row = quotes[i];
        const symbol = getAssetByMint(row.mint)?.symbol ?? row.mint.slice(0, 4);

        setProgress({ done: i, total: signed.length, current: symbol });

        const sig = await connection.sendRawTransaction(signed[i].serialize(), {
          skipPreflight: false,
          maxRetries: 3,
        });

        const latest = await connection.getLatestBlockhash();
        await connection.confirmTransaction(
          {
            signature: sig,
            blockhash: latest.blockhash,
            lastValidBlockHeight: latest.lastValidBlockHeight,
          },
          "confirmed"
        );

        sigs.push(sig);
        setSignatures([...sigs]);
        setProgress({ done: i + 1, total: signed.length, current: symbol });
      }
    } catch (e: any) {
      setError(e?.message ?? "Execution failed");
    } finally {
      setExecuting(false);
    }
  };

  const executeDca = async () => {
    if (validation) {
      setError(validation);
      return;
    }
    if (!publicKey || !signTransaction) return;

    // In DCA mode, we don't require preview quotes.
    resetDca();
    setDcaMessages([]);
    setDcaProgress({ done: 0, total: allocations.length });
    setError(null);

    try {
      const msgs: string[] = [];

      for (let i = 0; i < allocations.length; i++) {
        const alloc = allocations[i];
        const asset = getAssetByMint(alloc.mint);
        const symbol = asset?.symbol ?? alloc.mint.slice(0, 4);

        setDcaProgress({ done: i, total: allocations.length, current: symbol });

        // ✅ inAmount should be TOTAL allocation for this asset
        const inAmount = Math.floor(alloc.usd * 10 ** USDC.decimals);

        const res = await createAndExecuteTimeOrder({
          params: {
            user: publicKey.toBase58(),
            inputMint: USDC.mint,
            outputMint: alloc.mint,
            inAmount,
            numberOfOrders: dcaOrders,
            interval: dcaInterval,
          },
          signTransaction,
        });

        if (res) {
          msgs.push(`Recurring buy set for ${symbol} (${dcaOrders} orders)`);
          setDcaMessages([...msgs]);
        } else {
          throw new Error(`Failed to create DCA for ${symbol}`);
        }

        setDcaProgress({
          done: i + 1,
          total: allocations.length,
          current: symbol,
        });
      }
    } catch (e: any) {
      setError(e?.message ?? "DCA failed");
    }
  };

  useEffect(() => {
    setQuotes([]);
    setSignatures([]);
    setError(null);
    setProgress(null);
    setDcaMessages([]);
    setDcaProgress(null);
  }, [basketId, amount, mode]);

  const tradesCount = basket.items.length;

  const showPreview = mode === "once";
  const primaryDisabled =
    !!validation ||
    (mode === "once"
      ? executing || !quotes.length
      : dcaStatus === "submitting");

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{ width: "min(640px, 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="section-title">
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <BasketLogo basket={basket} size={44} />
            <div>
              <h2>Buy Basket</h2>
              <p className="muted">
                {mode === "once"
                  ? `we’ll split your USDC and buy ${tradesCount} assets.`
                  : `we’ll set ${tradesCount} recurring buys`}
              </p>
            </div>
          </div>
          <button className="pill" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="form-grid">
          <label className="input-label">
            <div className="segmented" role="group" aria-label="Purchase mode">
              <button
                type="button"
                className={`segmented-btn${
                  mode === "once" ? " is-active" : ""
                }`}
                onClick={() => setMode("once")}
              >
                One-time
              </button>
              <button
                type="button"
                className={`segmented-btn${mode === "dca" ? " is-active" : ""}`}
                onClick={() => setMode("dca")}
              >
                Recurring (DCA)
              </button>
            </div>
            <p className="muted">
              {mode === "once"
                ? "Preview first, then buy with one signature."
                : `Splits across ${dcaOrders} orders • approx $${perOrderUsd.toFixed(
                    2
                  )} per order per asset.`}
            </p>
          </label>

          <label className="input-label">
            Basket
            <select
              value={basketId}
              onChange={(e) => setBasketId(e.target.value)}
            >
              {BASKETS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <p className="muted">{basket.description}</p>
          </label>

          <label className="input-label">
            Total amount (USDC)
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="300"
            />
            <p className="muted">Approx {totalDisplay}</p>
            <div className="chip-row" style={{ marginTop: 8 }}>
              {[100, 300, 500, 1000].map((v) => (
                <button
                  key={v}
                  className={`chip${Number(amount) === v ? " is-active" : ""}`}
                  type="button"
                  onClick={() => setAmount(String(v))}
                >
                  ${v}
                </button>
              ))}
            </div>
          </label>

          {mode === "dca" && (
            <>
              <label className="input-label">
                DCA orders
                <input
                  type="number"
                  min={2}
                  value={dcaOrders}
                  onChange={(e) =>
                    setDcaOrders(Math.max(2, Number(e.target.value) || 2))
                  }
                />
                <p className="muted">
                  Each asset will be bought in {dcaOrders} slices.
                </p>
              </label>

              <label className="input-label">
                DCA interval
                <div
                  className="segmented"
                  role="group"
                  aria-label="DCA frequency"
                >
                  {[86400, 604800, 2628000].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className={`segmented-btn${
                        dcaInterval === sec ? " is-active" : ""
                      }`}
                      onClick={() => setDcaInterval(sec)}
                    >
                      {sec === 86400
                        ? "Daily"
                        : sec === 604800
                        ? "Weekly"
                        : "Monthly"}
                    </button>
                  ))}
                </div>
              </label>
            </>
          )}
        </div>

        <div className="info-card">
          <strong>Allocations</strong>
          {mode === "once" && (
            <p className="muted" style={{ marginTop: 6 }}>
              {tradesCount} trades • Slippage: {(SLIPPAGE_BPS / 100).toFixed(2)}
              %
            </p>
          )}

          <div className="list-compact">
            {displayItems.map((item) => {
              const alloc = allocationsByMint.get(item.mint);
              const usd = alloc?.usd ?? 0;
              return (
                <div key={item.mint} className="list-item">
                  <div>
                    <strong>{item.symbol}</strong>
                    <span>{item.name}</span>
                  </div>
                  <div>
                    <strong>
                      {
                        formatMoney({
                          usdAmount: usd,
                          inrAmount: usd * FX,
                          currency,
                          fxRate: FX,
                        }).primaryText
                      }
                    </strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {progress && (
          <div className="info-card">
            <strong>Buying…</strong>
            <p className="muted">
              {progress.done}/{progress.total}{" "}
              {progress.current ? `• ${progress.current}` : ""}
            </p>
          </div>
        )}

        {dcaProgress && (
          <div className="info-card">
            <strong>Setting recurring buys…</strong>
            <p className="muted">
              {dcaProgress.done}/{dcaProgress.total}{" "}
              {dcaProgress.current ? `• ${dcaProgress.current}` : ""}
            </p>
            <p className="muted" style={{ marginTop: 6 }}>
              You may need to approve {allocations.length} transactions.
            </p>
          </div>
        )}

        {validation && (
          <div className="info-card">
            <strong>Check</strong>
            <p className="muted">{validation}</p>
          </div>
        )}

        <div className="hero-actions">
          {showPreview && (
            <button
              className="pill"
              onClick={fetchQuotes}
              disabled={loadingQuote || !!validation}
              type="button"
            >
              {loadingQuote ? "Loading..." : "Preview"}
            </button>
          )}

          <button
            className="pill primary"
            onClick={mode === "once" ? executeOnce : executeDca}
            disabled={primaryDisabled}
            type="button"
          >
            {mode === "once"
              ? executing
                ? "Buying..."
                : "Buy basket"
              : dcaStatus === "submitting"
              ? "Creating DCA..."
              : "Start DCA"}
          </button>
        </div>

        {mode === "once" && quotes.length > 0 && !error && (
          <div className="info-card">
            <strong>Estimated received</strong>
            <div className="list-compact">
              {quotes.map((q) => {
                const asset = getAssetByMint(q.mint);
                const symbol = asset?.symbol ?? q.mint.slice(0, 4);
                const decimals = asset?.decimals ?? 6;

                return (
                  <div key={q.mint} className="list-item">
                    <div>
                      <strong>{symbol}</strong>
                      <span>Est. out</span>
                    </div>
                    <div>
                      <strong>
                        {formatTokenAmountRaw(q.quote?.outAmount, decimals)}
                      </strong>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {dcaMessages.length > 0 && (
          <div className="info-card">
            <strong>DCA created</strong>
            {dcaMessages.map((msg) => (
              <p key={msg} className="muted">
                {msg}
              </p>
            ))}
          </div>
        )}

        {signatures.length > 0 && (
          <div className="info-card">
            <strong>Confirmed</strong>
            {signatures.map((sig) => (
              <p key={sig} className="muted">
                {sig}
              </p>
            ))}
          </div>
        )}

        {(error || dcaError) && (
          <div className="info-card">
            <strong>Error</strong>
            <p className="muted">{error ?? dcaError}</p>
          </div>
        )}
      </div>
    </div>
  );
}
