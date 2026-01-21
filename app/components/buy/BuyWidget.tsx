"use client";

import { useEffect, useMemo, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useJupiterQuote } from "../../hooks/useJupiterQuote";
import { useJupiterSwap } from "../../hooks/useJupiterSwaps";
import { ALL_ASSETS } from "../../config/assets";
import { USDC } from "../../config/tokens";
import useCurrency from "../../hooks/useCurrency";
import { formatMoney } from "../../lib/format/formatMoney";

const SLIPPAGE_BPS = 50;

export default function BuyWidget({ onClose }: { onClose: () => void }) {
  const { currency } = useCurrency();
  const { connected } = useWallet();
  const [toMint, setToMint] = useState(ALL_ASSETS[0].mint);
  const [amount, setAmount] = useState("100");

  const toAsset = useMemo(() => ALL_ASSETS.find((a) => a.mint === toMint)!, [toMint]);
  const amountDisplay = useMemo(() => {
    const num = Number(amount) || 0;
    return formatMoney({ usdAmount: num, inrAmount: num * 83, currency }).primaryText;
  }, [amount, currency]);

  const { data: quote, isFetching, refetch } = useJupiterQuote({
    inputMint: USDC.mint,
    outputMint: toAsset.mint,
    amount,
    slippageBps: SLIPPAGE_BPS,
    decimals: USDC.decimals
  });

  const { swap, status, error, reset } = useJupiterSwap();
  const [signature, setSignature] = useState<string | null>(null);

  useEffect(() => {
    reset();
    setSignature(null);
  }, [toMint, amount, reset]);

  const handleSwap = async () => {
    if (!quote) return;
    const txid = await swap({
      inputMint: USDC.mint,
      outputMint: toAsset.mint,
      amount: Math.floor(parseFloat(amount || "0") * 10 ** USDC.decimals),
      slippageBps: SLIPPAGE_BPS
    });
    if (txid) setSignature(txid);
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="section-title">
          <h2>Buy / Swap</h2>
          <button className="pill" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="form-grid">
          <label className="input-label">
            Pay with
            <div className="pill">{USDC.symbol}</div>
          </label>

          <label className="input-label">
            Receive asset
            <select value={toMint} onChange={(e) => setToMint(e.target.value)}>
              {ALL_ASSETS.filter((a) => a.mint !== USDC.mint).map((asset) => (
                <option key={asset.mint} value={asset.mint}>
                  {asset.symbol} ({asset.name})
                </option>
              ))}
            </select>
          </label>

          <label className="input-label">
            Amount in {USDC.symbol}
            <input
              type="number"
              value={amount}
              min="0"
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100"
            />
            <p className="muted">Approx {amountDisplay}</p>
          </label>
        </div>

        <div className="hero-actions">
          <button className="pill" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Loading..." : "Get quote"}
          </button>
          <button
            className="pill primary"
            onClick={handleSwap}
            disabled={!quote || status === "preparing" || status === "signing" || status === "confirming" || !connected}
          >
            {status === "signing" || status === "confirming" ? "Processing..." : "Swap & Buy"}
          </button>
        </div>

        {quote && !error && (
          <div className="info-card">
            <strong>Route ready</strong>
            <p className="muted">
              {(() => {
                const out =
                  Number(quote.outAmount ?? 0) /
                  10 ** (toAsset?.decimals ?? 0);
                const impact = Number(quote.priceImpactPct ?? 0) * 100;
                return `Est. out: ${out.toFixed(6)} ${toAsset.symbol} • Impact: ${impact.toFixed(2)}%`;
              })()}
            </p>
          </div>
        )}

        {signature && (
          <div className="info-card">
            <strong>Submitted</strong>
            <p className="muted">Signature: {signature}</p>
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
