export const SALE_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: "bg-yellow-50", text: "text-yellow-700" },
  PAID: { bg: "bg-green-50", text: "text-green-700" },
  COMPLETED: { bg: "bg-emerald-50", text: "text-emerald-700" },
  CANCELLED: { bg: "bg-red-50", text: "text-red-700" },
};

export const PAYMENT_STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  UNPAID: { bg: "bg-red-50", text: "text-red-700" },
  PARTIALLY_PAID: { bg: "bg-amber-50", text: "text-amber-700" },
  PAID: { bg: "bg-green-50", text: "text-green-700" },
};

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "MOBILE_MONEY_MTN", label: "MTN Mobile Money" },
  { value: "MOBILE_MONEY_ORANGE", label: "Orange Money" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CREDIT", label: "Credit (Pay Later)" },
] as const;

export const SALE_TYPES = [
  { value: "IN_SHOP", label: "Regular Sale" },
  { value: "CREDIT", label: "Credit Sale" },
] as const;

export const DEFAULT_TAX_PERCENT = 0;

export function formatCurrency(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}
