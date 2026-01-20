"use client";

import { useEffect, useState } from "react";

type Currency = "INR" | "USD";

export default function CurrencyToggle() {
  const [currency, setCurrency] = useState<Currency>("INR");

  useEffect(() => {
    const saved = window.localStorage.getItem(
      "Ascend_currency"
    ) as Currency | null;
    if (saved === "INR" || saved === "USD") {
      setCurrency(saved);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("Ascend_currency", currency);
    document.documentElement.dataset.currency = currency;
  }, [currency]);

  return (
    <div className="segmented" role="group" aria-label="Display currency">
      <button
        className={`segmented-btn${currency === "INR" ? " is-active" : ""}`}
        onClick={() => setCurrency("INR")}
        type="button"
        aria-pressed={currency === "INR"}
      >
        INR
      </button>
      <button
        className={`segmented-btn${currency === "USD" ? " is-active" : ""}`}
        onClick={() => setCurrency("USD")}
        type="button"
        aria-pressed={currency === "USD"}
      >
        USD
      </button>
    </div>
  );
}
