export type Currency = "INR" | "USD";

export default function useCurrency() {
  const currency: Currency = "INR";
  return { currency };
}
