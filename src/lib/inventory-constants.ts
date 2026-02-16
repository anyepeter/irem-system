export const PRODUCT_CONDITIONS = [
  { value: "NEW", label: "New" },
  { value: "REFURBISHED", label: "Refurbished" },
  { value: "USED", label: "Used" },
] as const;

export const PRODUCT_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "DISCONTINUED", label: "Discontinued" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
] as const;

export const MOVEMENT_TYPES = [
  { value: "IN", label: "Stock In" },
  { value: "OUT", label: "Stock Out" },
  { value: "ADJUSTMENT", label: "Adjustment" },
  { value: "RETURN", label: "Return" },
  { value: "DAMAGE", label: "Damage" },
] as const;

export const UNITS = [
  "pcs",
  "kg",
  "g",
  "liters",
  "ml",
  "meters",
  "cm",
  "boxes",
  "sets",
  "rolls",
] as const;

export const CONDITION_COLORS: Record<string, { bg: string; text: string }> = {
  NEW: { bg: "bg-green-50", text: "text-green-700" },
  REFURBISHED: { bg: "bg-blue-50", text: "text-blue-700" },
  USED: { bg: "bg-amber-50", text: "text-amber-700" },
};

export const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  ACTIVE: { bg: "bg-green-50", text: "text-green-700" },
  DISCONTINUED: { bg: "bg-gray-50", text: "text-gray-700" },
  OUT_OF_STOCK: { bg: "bg-red-50", text: "text-red-700" },
};

export const MOVEMENT_COLORS: Record<string, { bg: string; text: string }> = {
  IN: { bg: "bg-green-50", text: "text-green-700" },
  OUT: { bg: "bg-red-50", text: "text-red-700" },
  ADJUSTMENT: { bg: "bg-blue-50", text: "text-blue-700" },
  RETURN: { bg: "bg-amber-50", text: "text-amber-700" },
  DAMAGE: { bg: "bg-rose-50", text: "text-rose-700" },
};

export const DEFAULT_REORDER_LEVEL = 5;
export const SKU_PREFIX = "PROD";

export function calculateProfitMargin(purchasePrice: number, sellingPrice: number): number {
  if (sellingPrice <= 0) return 0;
  return Number((((sellingPrice - purchasePrice) / sellingPrice) * 100).toFixed(2));
}

export function formatPrice(price: number | string): string {
  const num = typeof price === "string" ? parseFloat(price) : price;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}
