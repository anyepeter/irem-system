"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MovementHistory } from "./movement-history";
import { getStockMovements } from "@/actions/inventory";
import { MOVEMENT_TYPES } from "@/lib/inventory-constants";
import { ChevronLeft, ChevronRight, Filter } from "lucide-react";

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

type Props = {
  initialMovements: Movement[];
  initialTotal: number;
};

export function MovementsPageClient({ initialMovements, initialTotal }: Props) {
  const [movements, setMovements] = useState(initialMovements);
  const [total, setTotal] = useState(initialTotal);
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchMovements = (params: { type?: string; page?: number }) => {
    startTransition(async () => {
      const result = await getStockMovements({
        type: params.type === "all" ? undefined : params.type,
        page: params.page || 1,
        limit,
      });
      setMovements(result.movements as unknown as Movement[]);
      setTotal(result.total);
    });
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    setPage(1);
    fetchMovements({ type: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchMovements({ type: typeFilter, page: newPage });
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <Select value={typeFilter} onValueChange={handleTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Movement Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {MOVEMENT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-gray-500 ml-auto">
          {total} movement{total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Movements List */}
      <div className={isPending ? "opacity-50 pointer-events-none" : ""}>
        <MovementHistory movements={movements} />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => handlePageChange(page - 1)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages || isPending} onClick={() => handlePageChange(page + 1)}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
