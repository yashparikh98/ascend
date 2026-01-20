import { useEffect, useState } from "react";

export type Currency = "INR" | "USD";

export default function useCurrency() {
  const [currency, setCurrency] = useState<Currency>("INR");

  useEffect(() => {
    const saved = window.localStorage.getItem(
      "Ascend_currency"
    ) as Currency | null;
    if (saved === "INR" || saved === "USD") {
      setCurrency(saved);
      document.documentElement.dataset.currency = saved;
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.currency = currency;
  }, [currency]);

  return { currency };
}
