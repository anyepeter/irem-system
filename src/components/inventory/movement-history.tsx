"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { MOVEMENT_COLORS } from "@/lib/inventory-constants";
import { ArrowDownLeft, ArrowUpRight, RefreshCw, RotateCcw, AlertTriangle, Package } from "lucide-react";

type Movement = {
  id: string;
  type: string;
  quantity: number;
  reason: string;
  notes: string | null;
  reference: string | null;
  createdAt: Date | string;
  product: { name: string; sku: string };
  createdBy: { username: string };
};

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  IN: ArrowDownLeft,
  OUT: ArrowUpRight,
  ADJUSTMENT: RefreshCw,
  RETURN: RotateCcw,
  DAMAGE: AlertTriangle,
};

export function MovementHistory({ movements }: { movements: Movement[] }) {
  if (movements.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">No stock movements found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      {movements.map((m, i) => {
        const Icon = typeIcons[m.type] || Package;
        const colors = MOVEMENT_COLORS[m.type] || { bg: "bg-gray-50", text: "text-gray-700" };
        const date = new Date(m.createdAt);

        return (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="p-3">
              <div className="flex items-start gap-3">
                <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", colors.bg)}>
                  <Icon className={cn("w-4 h-4", colors.text)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("text-xs", colors.bg, colors.text)}>
                        {m.type}
                      </Badge>
                      <span className="text-sm font-medium text-gray-900">
                        {m.type === "IN" || m.type === "RETURN" ? "+" : m.type === "OUT" || m.type === "DAMAGE" ? "-" : ""}
                        {m.quantity}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">
                      {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5">{m.reason}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{m.product.name} ({m.product.sku})</span>
                    <span>by {m.createdBy.username}</span>
                    {m.reference && <span>Ref: {m.reference}</span>}
                  </div>
                  {m.notes && <p className="text-xs text-gray-400 mt-1 italic">{m.notes}</p>}
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
