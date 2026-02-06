type Currency = "USD" | "INR";

const formatters: Record<Currency, Intl.NumberFormat> = {
  INR: new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }),
  USD: new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }),
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
  const inrValue = inrAmount ?? usdAmount * fxRate;
  const usdValue = usdAmount;
  const inrText = formatters.INR.format(inrValue);
  const usdText = formatters.USD.format(usdValue);
  const primaryText = `${inrText} (${usdText})`;
  const secondaryText = usdText;

  return { primaryText, secondaryText };
}
