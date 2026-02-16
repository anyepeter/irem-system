"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { adjustStock } from "@/actions/inventory";
import { MOVEMENT_TYPES } from "@/lib/inventory-constants";

type Props = {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  currentStock: number;
  unit: string;
  onSuccess?: () => void;
};

export function StockAdjustmentModal({ open, onClose, productId, productName, currentStock, unit, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const formData = new FormData(e.currentTarget);
    formData.set("productId", productId);

    startTransition(async () => {
      const result = await adjustStock(formData);
      if (result.success) {
        onClose();
        onSuccess?.();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock: {productName}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-500">Current stock: <span className="font-medium">{currentStock} {unit}</span></p>

        {error && (
          <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Movement Type *</Label>
            <Select name="type" required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {MOVEMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input id="quantity" name="quantity" type="number" min="1" required />
          </div>

          <div>
            <Label htmlFor="reason">Reason *</Label>
            <Input id="reason" name="reason" required placeholder="e.g., Restocked from supplier" />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-y"
              placeholder="Optional additional notes"
            />
          </div>

          <div>
            <Label htmlFor="reference">Reference (Ticket/Order #)</Label>
            <Input id="reference" name="reference" placeholder="Optional" />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={isPending} className="flex-1">
              {isPending ? "Processing..." : "Record Movement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
