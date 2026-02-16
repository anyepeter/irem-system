"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { recordPayment, type ActionResult } from "@/actions/ticket";
import { PAYMENT_STATUS_COLORS } from "@/lib/ticket-constants";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Clock,
  User,
} from "lucide-react";

type PaymentRecord = {
  id: string;
  amount: unknown;
  paymentMethod: string;
  note: string | null;
  createdAt: string;
  recordedBy: { username: string };
};

type Props = {
  ticketId: string;
  totalAmount: number;
  amountPaid: number;
  paymentStatus: string;
  diagnosticFee: number;
  diagnosticPaid: boolean;
  finalCost: number;
  deliveryFee: number;
  paymentHistory: PaymentRecord[];
  onSuccess?: () => void;
};

export function PaymentForm({
  ticketId,
  totalAmount,
  amountPaid,
  paymentStatus,
  diagnosticFee,
  diagnosticPaid,
  finalCost,
  deliveryFee,
  paymentHistory,
  onSuccess,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState("");

  const remaining = totalAmount - amountPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.set("amountPaid", String(amount));
    formData.set("paymentMethod", method);

    const res = await recordPayment(ticketId, formData);
    setResult(res);
    setLoading(false);

    if (res.success) {
      setAmount(0);
      setTimeout(() => {
        setResult(null);
        onSuccess?.();
      }, 1500);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Breakdown */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Diagnostic Fee</span>
              <span>
                {diagnosticFee.toLocaleString()} XAF
                {diagnosticPaid && (
                  <span className="text-xs text-green-600 ml-1">(Paid)</span>
                )}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Repair Cost</span>
              <span>{finalCost.toLocaleString()} XAF</span>
            </div>
            {deliveryFee > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Delivery Fee</span>
                <span>{deliveryFee.toLocaleString()} XAF</span>
              </div>
            )}
            <div className="border-t pt-2 flex justify-between font-semibold text-base">
              <span>Total</span>
              <span>{totalAmount.toLocaleString()} XAF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid</span>
              <span className="text-green-600 font-medium">
                {amountPaid.toLocaleString()} XAF
              </span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Remaining</span>
              <span className={remaining > 0 ? "text-red-600" : "text-green-600"}>
                {remaining.toLocaleString()} XAF
              </span>
            </div>
            <div className="flex justify-end">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS_COLORS[paymentStatus] || ""
                  }`}
              >
                {paymentStatus.replace("_", " ")}
              </span>
            </div>
          </div>

          {/* Payment form */}
          {remaining > 0 && (
            <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t">
              <div className="space-y-2">
                <Label>Amount (XAF)</Label>
                <Input
                  type="number"
                  value={amount || ""}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min={1}
                  max={remaining}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={method} onValueChange={setMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${result.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}
                >
                  {result.success ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  {result.message}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loading || !method || amount <= 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Record Payment"
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      {paymentHistory.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Payment History
              <span className="ml-auto text-xs font-normal text-gray-400">
                {paymentHistory.length} payment{paymentHistory.length !== 1 ? "s" : ""}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentHistory.map((record) => (
                <div
                  key={record.id}
                  className="flex items-start justify-between gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-green-700">
                        +{Number(record.amount).toLocaleString()} XAF
                      </span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600">
                        {record.paymentMethod}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {record.recordedBy.username}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(record.createdAt).toLocaleDateString()}{" "}
                        {new Date(record.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
