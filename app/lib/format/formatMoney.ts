import { Currency } from "../hooks/useCurrency";

const formatters: Record<Currency, Intl.NumberFormat> = {
  INR: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }),
  USD: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })
};

export function formatMoney({
  usdAmount,
  inrAmount,
  currency,
  fxRate = 83
}: {
  usdAmount: number;
  inrAmount?: number;
  currency: Currency;
  fxRate?: number;
}) {
  const primary = currency === "USD" ? usdAmount : inrAmount ?? usdAmount * fxRate;
  const secondary = currency === "USD" ? inrAmount ?? usdAmount * fxRate : usdAmount;

  const primaryText = formatters[currency].format(primary);
  const secondaryText = currency === "USD"
    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(secondary)
    : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(secondary);

  return { primaryText, secondaryText };
}
