"use client";

import { useMemo, useState, useCallback } from "react";
import useAuth from "../../hooks/useAuth";
import { USDC, SOL } from "../../config/tokens";
import { formatMoney } from "../../lib/format/formatMoney";
import useCurrency from "../../hooks/useCurrency";

import { MoonPayProvider, MoonPayBuyWidget } from "@moonpay/moonpay-react";

type PaymentChoice = "auto" | "credit_debit_card" | "apple_pay" | "google_pay";

const FX_RATE = 83; // mock; later plug your real INR/USD fx

export default function OnrampWidget({ onClose }: { onClose: () => void }) {
  const { walletAddress } = useAuth();
  const { currency } = useCurrency();

  const [asset, setAsset] = useState<string>(USDC.mint);
  const [fiatAmount, setFiatAmount] = useState("100");
  const [paymentChoice, setPaymentChoice] = useState<PaymentChoice>("auto");

  const apiKey = process.env.NEXT_PUBLIC_MOONPAY_PUBLIC_KEY;

  const assetSymbol = asset === USDC.mint ? USDC.symbol : SOL.symbol;
  const defaultCurrencyCode = assetSymbol.toLowerCase();

  const approx = useMemo(() => {
    const num = Number(fiatAmount) || 0;
    return formatMoney({
      usdAmount: num,
      inrAmount: num * FX_RATE,
      currency,
      fxRate: FX_RATE,
    }).primaryText;
  }, [fiatAmount, currency]);

  /**
   * IMPORTANT:
   * Apple Pay / Google Pay generally won't work inside iframe-based variants.
   * To avoid a broken UX, we switch to newTab for those payment methods.
   * Docs: mobile payments not supported with iframe variants; feature matrix shows iframe ❌. :contentReference[oaicite:4]{index=4}
   */
  const widgetVariant = useMemo(() => {
    if (paymentChoice === "apple_pay" || paymentChoice === "google_pay")
      return "newTab";
    return "embedded";
  }, [paymentChoice]);

  /**
   * paymentMethod param supports these values. :contentReference[oaicite:5]{index=5}
   * If "auto", we omit paymentMethod so MoonPay can show the best available methods for the user/region/device.
   */
  const paymentMethodProp = useMemo(() => {
    if (paymentChoice === "auto") return undefined;
    return paymentChoice;
  }, [paymentChoice]);

  /**
   * URL signing is required when using walletAddress. :contentReference[oaicite:6]{index=6}
   * MoonPay React SDK will call this whenever it needs a signature.
   *
   * You MUST implement /api/moonpay/sign on your backend (server-side) using your MoonPay secret.
   * Never sign in the browser.
   */
  const onUrlSignatureRequested = useCallback(
    async (url: string): Promise<string> => {
      const res = await fetch(
        `/api/moonpay/sign?url=${encodeURIComponent(url)}`,
        {
          method: "GET",
        }
      );
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to sign MoonPay URL");
      }
      const data = (await res.json()) as { signature: string };
      return data.signature;
    },
    []
  );

  const theme = useMemo(
    () => ({
      // keep consistent with your app theme
      fontColor: "#141312",
      primaryColor: "#0f6b5b",
      secondaryColor: "#1a8c79",
      backgroundColor: "#f6f4f1",
      borderRadius: "18px",
      inputBackgroundColor: "#ffffff",
      inputBorderColor: "#e4dfd7",
    }),
    []
  );

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
            <h2>Add funds</h2>
            <p className="muted">Buy USDC first, then invest in assets.</p>
          </div>
          <button className="pill" onClick={onClose} type="button">
            Close
          </button>
        </div>

        <div className="form-grid">
          <label className="input-label">
            Asset
            <select value={asset} onChange={(e) => setAsset(e.target.value)}>
              <option value={USDC.mint}>USDC (recommended)</option>
              <option value={SOL.mint}>SOL (network fees)</option>
            </select>
            <p className="muted">
              {asset === USDC.mint
                ? "USDC is used to buy stocks/indices inside the app."
                : "SOL is mainly for network fees; keep a small amount."}
            </p>
          </label>

          <label className="input-label">
            Amount (USD)
            <input
              type="number"
              min="0"
              inputMode="decimal"
              value={fiatAmount}
              onChange={(e) => setFiatAmount(e.target.value)}
              placeholder="100"
            />
            <p className="muted">Approx {approx}</p>
          </label>

          <label className="input-label">
            Pay with
            <div className="segmented" role="group" aria-label="Payment method">
              <button
                type="button"
                className={`segmented-btn${
                  paymentChoice === "auto" ? " is-active" : ""
                }`}
                onClick={() => setPaymentChoice("auto")}
              >
                Auto
              </button>
              <button
                type="button"
                className={`segmented-btn${
                  paymentChoice === "credit_debit_card" ? " is-active" : ""
                }`}
                onClick={() => setPaymentChoice("credit_debit_card")}
              >
                Card
              </button>
              <button
                type="button"
                className={`segmented-btn${
                  paymentChoice === "apple_pay" ? " is-active" : ""
                }`}
                onClick={() => setPaymentChoice("apple_pay")}
              >
                Apple Pay
              </button>
              <button
                type="button"
                className={`segmented-btn${
                  paymentChoice === "google_pay" ? " is-active" : ""
                }`}
                onClick={() => setPaymentChoice("google_pay")}
              >
                Google Pay
              </button>
            </div>
            {(paymentChoice === "apple_pay" ||
              paymentChoice === "google_pay") && (
              <p className="muted">
                Tip: Apple Pay / Google Pay generally won’t work inside embedded
                iframes, so we’ll open MoonPay in a new tab for a smoother
                checkout.
              </p>
            )}
          </label>
        </div>

        {!apiKey && (
          <div className="info-card">
            <strong>Configure MoonPay</strong>
            <p className="muted">
              Set NEXT_PUBLIC_MOONPAY_PUBLIC_KEY to enable onramp.
            </p>
          </div>
        )}

        {apiKey && !walletAddress && (
          <div className="info-card">
            <strong>Connect wallet</strong>
            <p className="muted">
              Connect Phantom/Solflare (or your login wallet) to receive funds.
            </p>
          </div>
        )}

        {apiKey && walletAddress && (
          <div className="iframe-container">
            <MoonPayProvider apiKey={apiKey} debug>
              <MoonPayBuyWidget
                variant={widgetVariant as any}
                visible
                baseCurrencyCode="usd"
                baseCurrencyAmount={fiatAmount}
                defaultCurrencyCode={defaultCurrencyCode}
                walletAddress={walletAddress}
                paymentMethod={paymentMethodProp as any}
                onUrlSignatureRequested={onUrlSignatureRequested}
              />
            </MoonPayProvider>
          </div>
        )}
      </div>
    </div>
  );
}
