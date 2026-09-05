export const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

export const currencyFormatterNoDecimals = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatCurrency(
  amount: number | null | undefined,
  options?: { maximumFractionDigits?: number; compact?: boolean },
): string {
  if (amount == null || isNaN(amount)) return "₹0";

  if (options?.compact && Math.abs(amount) >= 100000) {
    if (Math.abs(amount) >= 10000000) {
      return `₹${(amount / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(amount / 100000).toFixed(2)} L`;
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(amount);
}
