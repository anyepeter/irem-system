export const STANDARD_DIAGNOSTIC_FEE = 2000;

export const DEVICE_TYPES = [
  "Phone",
  "Laptop",
  "Desktop",
  "Tablet",
  "Smartwatch",
  "Gaming Console",
  "Other",
] as const;

export const POPULAR_BRANDS = [
  "Apple",
  "Samsung",
  "Huawei",
  "HP",
  "Dell",
  "Lenovo",
  "Asus",
  "Microsoft",
  "Sony",
  "LG",
  "Other",
] as const;

export const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  IN_DIAGNOSTICS: "bg-blue-100 text-blue-800",
  AWAITING_APPROVAL: "bg-orange-100 text-orange-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  IN_PROGRESS: "bg-purple-100 text-purple-800",
  WAITING_FOR_PARTS: "bg-gray-100 text-gray-800",
  COMPLETED: "bg-emerald-100 text-emerald-800",
  READY_FOR_PICKUP: "bg-teal-100 text-teal-800",
  OUT_FOR_DELIVERY: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_DIAGNOSTICS: "In Diagnostics",
  AWAITING_APPROVAL: "Awaiting Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_PARTS: "Waiting for Parts",
  COMPLETED: "Completed",
  READY_FOR_PICKUP: "Ready for Pickup",
  OUT_FOR_DELIVERY: "Out for Delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700",
  NORMAL: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  URGENT: "bg-red-100 text-red-700",
};

export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  UNPAID: "bg-red-100 text-red-700",
  PARTIALLY_PAID: "bg-yellow-100 text-yellow-700",
  PAID: "bg-green-100 text-green-700",
};
