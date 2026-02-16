"use client";

import { STATUS_COLORS, STATUS_LABELS } from "@/lib/ticket-constants";

export function TicketStatusBadge({ status }: { status: string }) {
  const colors = STATUS_COLORS[status] || "bg-gray-100 text-gray-800";
  const label = STATUS_LABELS[status] || status;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors}`}
    >
      {label}
    </span>
  );
}
