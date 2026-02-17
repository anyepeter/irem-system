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
import { processPayment } from "@/actions/sale";
import { PAYMENT_METHODS } from "@/lib/sales-constants";
import { formatCurrency } from "@/lib/sales-constants";
import { CheckCircle } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  saleId: string;
  saleNumber: string;
  totalAmount: number;
  amountDue: number;
  onSuccess?: (isPaid: boolean) => void;
};

export function PaymentModal({ open, onClose, saleId, saleNumber, totalAmount, amountDue, onSuccess }: Props) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [method, setMethod] = useState("");
  const [amount, setAmount] = useState(amountDue.toString());

  const change = Math.max(0, Number(amount) - amountDue);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const paymentData = {
      saleId,
      amount: Math.min(Number(amount), amountDue),
      paymentMethod: method,
      mobileMoneyNumber: (formData.get("mobileMoneyNumber") as string) || "",
      transactionId: (formData.get("transactionId") as string) || "",
      bankName: (formData.get("bankName") as string) || "",
      transferReference: (formData.get("transferReference") as string) || "",
      notes: (formData.get("notes") as string) || "",
    };

    startTransition(async () => {
      const result = await processPayment(paymentData);
      if (result.success) {
        setSuccess(true);
        onSuccess?.(result.data?.isPaid as boolean);
      } else {
        setError(result.message);
      }
    });
  };

  const handleClose = () => {
    setSuccess(false);
    setError("");
    setMethod("");
    onClose();
  };

  if (success) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md text-center">
          <div className="py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payment Successful!</h3>
            <p className="text-sm text-gray-500">Sale {saleNumber} has been processed.</p>
            <Button onClick={handleClose} className="mt-6 w-full">Done</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Payment - {saleNumber}</DialogTitle>
        </DialogHeader>

        <div className="bg-gray-50 rounded-xl p-4 text-center">
          <p className="text-sm text-gray-500">Amount Due</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(amountDue)} XAF</p>
          {amountDue < totalAmount && (
            <p className="text-xs text-gray-400 mt-1">Total: {formatCurrency(totalAmount)} XAF</p>
          )}
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 px-3 py-2 rounded-lg text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Payment Method Selection */}
          <div>
            <Label>Payment Method *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-1 gap-2 mt-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMethod(m.value)}
                  className={`text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium ${
                    method === m.value
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">Amount (XAF) *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {method === "CASH" && change > 0 && (
              <p className="text-sm text-emerald-600 mt-1 font-medium">
                Change: {formatCurrency(change)} XAF
              </p>
            )}
          </div>

          {/* Mobile Money Fields */}
          {(method === "MOBILE_MONEY_MTN" || method === "MOBILE_MONEY_ORANGE") && (
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <div>
                <Label htmlFor="mobileMoneyNumber">Phone Number</Label>
                <Input id="mobileMoneyNumber" name="mobileMoneyNumber" placeholder="e.g., 6XXXXXXXX" />
              </div>
              <div>
                <Label htmlFor="transactionId">Transaction ID</Label>
                <Input id="transactionId" name="transactionId" placeholder="Optional" />
              </div>
            </div>
          )}

          {/* Bank Transfer Fields */}
          {method === "BANK_TRANSFER" && (
            <div className="space-y-3 bg-gray-50 rounded-xl p-4">
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input id="bankName" name="bankName" placeholder="e.g., UBA, BICEC" />
              </div>
              <div>
                <Label htmlFor="transferReference">Transfer Reference</Label>
                <Input id="transferReference" name="transferReference" placeholder="Optional" />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              name="notes"
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[60px] resize-y"
              placeholder="Optional notes"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !method} className="flex-1">
              {isPending ? "Processing..." : `Pay ${formatCurrency(Math.min(Number(amount), amountDue))} XAF`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
