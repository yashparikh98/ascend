"use client";

import { useMemo, useState, useEffect } from "react";
import { ALL_ASSETS } from "../../config/assets";
import { USDC } from "../../config/tokens";
import { useWallet } from "@solana/wallet-adapter-react";
import useCurrency from "../../hooks/useCurrency";
import { formatMoney } from "../../lib/format/formatMoney";
import { useJupiterRecurring } from "../../hooks/useJupiterDca";

const FX = 83;

// UX defaults: "horizon" that feels normal
const DEFAULT_ORDERS_BY_INTERVAL: Record<number, number> = {
  86400: 30, // Daily -> 30 days
  604800: 12, // Weekly -> 12 weeks (~3 months)
  2628000: 6, // Monthly -> 6 months
};

const intervals = [
  { label: "Daily", seconds: 86400 },
  { label: "Weekly", seconds: 604800 },
  { label: "Monthly", seconds: 2628000 },
];

const amountPresets = [25, 50, 100, 250]; // USDC

export default function DcaWidget({ onClose }: { onClose: () => void }) {
  const { publicKey, signTransaction } = useWallet();
  const { currency } = useCurrency();

  const [toMint, setToMint] = useState(ALL_ASSETS[0].mint);
  const [amountPerOrder, setAmountPerOrder] = useState("50"); // in USDC
  const [interval, setInterval] = useState(intervals[1].seconds); // default Weekly

  // smart default duration (orders) derived from interval
  const [numberOfOrders, setNumberOfOrders] = useState(
    DEFAULT_ORDERS_BY_INTERVAL[intervals[1].seconds]
  );

  const toAsset = useMemo(
    () => ALL_ASSETS.find((a) => a.mint === toMint)!,
    [toMint]
  );

  // When user changes frequency, update number of orders to a sensible default
  useEffect(() => {
    setNumberOfOrders((prev) => {
      // If user has customized it away from old default, preserve their choice.
      // Otherwise, apply the new default.
      const oldDefault = DEFAULT_ORDERS_BY_INTERVAL[interval] ?? prev;
      const nextDefault = DEFAULT_ORDERS_BY_INTERVAL[interval] ?? prev;

      // We don't know the "old interval" here (React state update timing),
      // so we use a simple rule: if user is on a very "default-looking" value,
      // snap to new default; else keep it.
      const isLikelyDefault = Object.values(
        DEFAULT_ORDERS_BY_INTERVAL
      ).includes(prev);
      return isLikelyDefault ? nextDefault : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval]);

  const perUsd = useMemo(() => Number(amountPerOrder) || 0, [amountPerOrder]);

  const approx = useMemo(() => {
    return formatMoney({
      usdAmount: perUsd,
      inrAmount: perUsd * FX,
      currency,
      fxRate: FX,
    }).primaryText;
  }, [perUsd, currency]);

  const totalUsd = useMemo(
    () => perUsd * numberOfOrders,
    [perUsd, numberOfOrders]
  );

  const intervalLabel = useMemo(() => {
    return intervals.find((i) => i.seconds === interval)?.label ?? "Custom";
  }, [interval]);

  const { createAndExecuteTimeOrder, status, error, response, reset } =
    useJupiterRecurring();

  const validation = useMemo(() => {
    if (!publicKey) return "Connect your wallet to start a recurring buy.";
    if (!signTransaction)
      return "Your wallet doesn’t support transaction signing.";
    if (!Number.isFinite(perUsd) || perUsd <= 0) return "Enter an amount.";
    if (numberOfOrders < 2) return "Minimum 2 orders.";
    // Jupiter recurring minimums
    if (totalUsd < 100) return "Minimum total deposit is $100.";
    if (perUsd < 50) return "Minimum is $50 per order.";
    if (toAsset.mint === USDC.mint) return "Choose an asset other than USDC.";
    return null;
  }, [
    publicKey,
    signTransaction,
    perUsd,
    numberOfOrders,
    totalUsd,
    toAsset.mint,
  ]);

  const summary = useMemo(() => {
    const humanEvery = intervalLabel.toLowerCase();
    const startText = "Starts now";
    const totalText = formatMoney({
      usdAmount: totalUsd,
      inrAmount: totalUsd * FX,
      currency,
      fxRate: FX,
    }).primaryText;

    return {
      line1: `You’ll invest ${
        formatMoney({
          usdAmount: perUsd,
          inrAmount: perUsd * FX,
          currency,
          fxRate: FX,
        }).primaryText
      } ${humanEvery} into ${toAsset.symbol}.`,
      line2: `${numberOfOrders} orders • Total deposit now: ${totalText} • ${startText}`,
    };
  }, [
    intervalLabel,
    currency,
    numberOfOrders,
    perUsd,
    toAsset.symbol,
    totalUsd,
  ]);

  const handleSubmit = async () => {
    if (!publicKey || !signTransaction) return;
    if (validation) return;

    // total deposit amount = amount per order * number of orders
    const inAmountRaw = Math.floor(
      perUsd * numberOfOrders * 10 ** USDC.decimals
    );

    await createAndExecuteTimeOrder({
      params: {
        user: publicKey.toBase58(),
        inputMint: USDC.mint,
        outputMint: toAsset.mint,
        inAmount: inAmountRaw,
        numberOfOrders,
        interval,
        minPrice: null,
        maxPrice: null,
        startAt: null,
      },
      signTransaction,
    });
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="modal-card"
        style={{ width: "min(560px, 100%)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="section-title">
          <div>
            <h2>Recurring Buy</h2>
            <p className="muted">Automate your investing in a simple way.</p>
          </div>
          <button className="pill" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="form-grid">
          <label className="input-label">
            Pay with
            <div className="pill">{USDC.symbol}</div>
            <p className="muted">We’ll use USDC for each purchase.</p>
          </label>

          <label className="input-label">
            Buy
            <select value={toMint} onChange={(e) => setToMint(e.target.value)}>
              {ALL_ASSETS.filter((a) => a.mint !== USDC.mint).map((asset) => (
                <option key={asset.mint} value={asset.mint}>
                  {asset.symbol} ({asset.name})
                </option>
              ))}
            </select>
          </label>

          <label className="input-label">
            Amount per purchase ({USDC.symbol})
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={amountPerOrder}
              onChange={(e) => setAmountPerOrder(e.target.value)}
              placeholder="50"
            />
            <div className="chip-row" style={{ marginTop: 8 }}>
              {amountPresets.map((v) => (
                <button
                  key={v}
                  className={`chip${
                    Number(amountPerOrder) === v ? " is-active" : ""
                  }`}
                  type="button"
                  onClick={() => setAmountPerOrder(String(v))}
                >
                  ${v}
                </button>
              ))}
            </div>
            <p className="muted" style={{ marginTop: 6 }}>
              Approx {approx}
            </p>
          </label>

          <label className="input-label">
            Frequency
            <div className="segmented" role="group" aria-label="Frequency">
              {intervals.map((opt) => (
                <button
                  key={opt.seconds}
                  className={`segmented-btn${
                    interval === opt.seconds ? " is-active" : ""
                  }`}
                  onClick={() => setInterval(opt.seconds)}
                  type="button"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </label>

          <label className="input-label">
            Duration
            <input
              type="number"
              min="2"
              value={numberOfOrders}
              onChange={(e) =>
                setNumberOfOrders(Math.max(2, Number(e.target.value) || 2))
              }
            />
            <p className="muted">
              Total deposit now: <strong>${totalUsd.toFixed(2)}</strong> (must
              be ≥ $100)
            </p>
          </label>
        </div>

        {/* One clear preview card (big UX win) */}
        <div className="info-card">
          <strong>Preview</strong>
          <p className="muted" style={{ marginTop: 6 }}>
            {summary.line1}
          </p>
          <p className="muted">{summary.line2}</p>
        </div>

        {validation && (
          <div className="info-card">
            <strong>Check</strong>
            <p className="muted">{validation}</p>
          </div>
        )}

        <div className="hero-actions">
          <button className="pill" onClick={reset} type="button">
            Reset
          </button>
          <button
            className="pill primary"
            onClick={handleSubmit}
            disabled={status === "submitting" || !!validation}
            type="button"
          >
            {status === "submitting" ? "Submitting..." : "Start recurring buy"}
          </button>
        </div>

        {response && (
          <div className="info-card">
            <strong>Recurring buy created</strong>
            <p className="muted">
              Status: {response?.execute?.status ?? "Unknown"} • Signature:{" "}
              {response?.execute?.signature ?? "-"}
            </p>
          </div>
        )}

        {error && (
          <div className="info-card">
            <strong>Error</strong>
            <p className="muted">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
