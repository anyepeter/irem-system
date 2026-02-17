"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { PaymentModal } from "./payment-modal";
import { cancelSale, deleteSale } from "@/actions/sale";
import {
  formatCurrency,
  SALE_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_METHODS,
} from "@/lib/sales-constants";
import {
  ArrowLeft,
  DollarSign,
  Ban,
  Trash2,
  Package,
  CreditCard,
  User,
  FileText,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type SaleItem = {
  id: string;
  productName: string;
  productSKU: string;
  quantity: number;
  unitPrice: number | { toString(): string };
  subtotal: number | { toString(): string };
  total: number | { toString(): string };
  profit: number | { toString(): string };
  product: { id: string; image: string | null };
};

type Payment = {
  id: string;
  paymentNumber: string;
  amount: number | { toString(): string };
  paymentMethod: string;
  mobileMoneyNumber: string | null;
  transactionId: string | null;
  bankName: string | null;
  transferReference: string | null;
  notes: string | null;
  paidAt: string | Date;
  createdBy: { username: string };
};

type Sale = {
  id: string;
  saleNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  saleType: string;
  subtotal: number | { toString(): string };
  discount: number | { toString(): string };
  discountType: string | null;
  tax: number | { toString(): string };
  taxPercent: number | { toString(): string };
  totalAmount: number | { toString(): string };
  amountPaid: number | { toString(): string };
  amountDue: number | { toString(): string };
  paymentStatus: string;
  status: string;
  notes: string | null;
  createdAt: string | Date;
  completedAt: string | Date | null;
  customer: { id: number; name: string; phone: string; isVIP: boolean } | null;
  createdBy: { username: string };
  items: SaleItem[];
  payments: Payment[];
};

type Props = {
  user: { username: string; avatar: string | null; role: string };
  sale: Sale;
  basePath: string;
};

export function SaleDetailClient({ user, sale, basePath }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showPayment, setShowPayment] = useState(false);
  const [error, setError] = useState("");

  const totalAmount = Number(sale.totalAmount);
  const amountDue = Number(sale.amountDue);
  const amountPaid = Number(sale.amountPaid);
  const statusColor = SALE_STATUS_COLORS[sale.status] || SALE_STATUS_COLORS.PENDING;
  const paymentColor = PAYMENT_STATUS_COLORS[sale.paymentStatus] || PAYMENT_STATUS_COLORS.UNPAID;

  const isAdmin = user.role === "ADMIN";

  const handleCancel = () => {
    if (!confirm("Are you sure you want to cancel this sale? Stock will be restored if it was paid.")) return;
    setError("");
    startTransition(async () => {
      const result = await cancelSale(sale.id);
      if (result.success) {
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to permanently delete this sale? This action cannot be undone.")) return;
    setError("");
    startTransition(async () => {
      const result = await deleteSale(sale.id);
      if (result.success) {
        router.push(`${basePath}/sales`);
      } else {
        setError(result.message);
      }
    });
  };

  const handlePaymentSuccess = () => {
    setShowPayment(false);
    router.refresh();
  };

  const getMethodLabel = (method: string) =>
    PAYMENT_METHODS.find((m) => m.value === method)?.label || method;

  const totalProfit = sale.items.reduce((sum, i) => sum + Number(i.profit), 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role as "ADMIN" | "CASHIER" | "TECHNICIAN"} username={user.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title={`Sale ${sale.saleNumber}`} subtitle="Sale details" username={user.username} avatar={user.avatar} />

        <div className="p-4 lg:p-6 space-y-6">
          {/* Back & Actions */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <Link href={`${basePath}/sales`}>
              <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Sales</Button>
            </Link>
            <div className="flex gap-2">
              {sale.status !== "CANCELLED" && sale.paymentStatus !== "PAID" && (
                <Button onClick={() => setShowPayment(true)}>
                  <DollarSign className="w-4 h-4 mr-2" /> Record Payment
                </Button>
              )}
              {isAdmin && sale.status !== "CANCELLED" && (
                <Button variant="outline" onClick={handleCancel} disabled={isPending} className="text-red-600 hover:bg-red-50">
                  <Ban className="w-4 h-4 mr-2" /> Cancel Sale
                </Button>
              )}
              {isAdmin && (
                <Button variant="outline" onClick={handleDelete} disabled={isPending} className="text-red-600 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Sale
                </Button>
              )}
            </div>
          </div>

        {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sale Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Bar */}
            <Card className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <p className="text-xs text-gray-500">Sale Number</p>
                  <p className="text-lg font-bold">{sale.saleNumber}</p>
                </div>
                <Badge className={`${statusColor.bg} ${statusColor.text}`}>{sale.status.replace("_", " ")}</Badge>
                <Badge className={`${paymentColor.bg} ${paymentColor.text}`}>{sale.paymentStatus.replace("_", " ")}</Badge>
                {sale.saleType === "CREDIT" && <Badge variant="outline">Credit Sale</Badge>}
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="text-sm">{new Date(sale.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </Card>

            {/* Items */}
            <Card className="p-4">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" /> Items ({sale.items.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50/50">
                      <th className="text-left px-3 py-2 text-xs font-medium text-gray-500">Product</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Price</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Qty</th>
                      <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Total</th>
                      {user.role === "ADMIN" && (
                        <th className="text-right px-3 py-2 text-xs font-medium text-gray-500">Profit</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sale.items.map((item) => (
                      <tr key={item.id} className="border-b last:border-0">
                        <td className="px-3 py-3">
                          <p className="text-sm font-medium">{item.productName}</p>
                          <p className="text-xs text-gray-500">{item.productSKU}</p>
                        </td>
                        <td className="px-3 py-3 text-sm text-right">{formatCurrency(Number(item.unitPrice))}</td>
                        <td className="px-3 py-3 text-sm text-right">{item.quantity}</td>
                        <td className="px-3 py-3 text-sm text-right font-medium">{formatCurrency(Number(item.total))}</td>
                        {user.role === "ADMIN" && (
                          <td className="px-3 py-3 text-sm text-right text-emerald-600">
                            {formatCurrency(Number(item.profit))}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Payments */}
            <Card className="p-4">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" /> Payments ({sale.payments.length})
              </h3>
              {sale.payments.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No payments recorded yet</p>
              ) : (
                <div className="space-y-3">
                  {sale.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center gap-4 bg-gray-50 rounded-xl p-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{payment.paymentNumber}</p>
                          <Badge variant="outline" className="text-xs">{getMethodLabel(payment.paymentMethod)}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(payment.paidAt).toLocaleString()} by {payment.createdBy.username}
                        </p>
                        {payment.mobileMoneyNumber && <p className="text-xs text-gray-500">Phone: {payment.mobileMoneyNumber}</p>}
                        {payment.transactionId && <p className="text-xs text-gray-500">TxID: {payment.transactionId}</p>}
                        {payment.bankName && <p className="text-xs text-gray-500">Bank: {payment.bankName}</p>}
                        {payment.notes && <p className="text-xs text-gray-500 italic">{payment.notes}</p>}
                      </div>
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(Number(payment.amount))} XAF</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Payment Summary */}
            <Card className="p-4">
              <h3 className="font-bold text-gray-900 mb-4">Payment Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(Number(sale.subtotal))} XAF</span>
                </div>
                {Number(sale.discount) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(Number(sale.discount))} XAF</span>
                  </div>
                )}
                {Number(sale.tax) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tax ({Number(sale.taxPercent)}%)</span>
                    <span>{formatCurrency(Number(sale.tax))} XAF</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)} XAF</span>
                </div>
                <div className="flex justify-between text-emerald-600">
                  <span>Paid</span>
                  <span>{formatCurrency(amountPaid)} XAF</span>
                </div>
                {amountDue > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Due</span>
                    <span>{formatCurrency(amountDue)} XAF</span>
                  </div>
                )}
              </div>

              {user.role === "ADMIN" && (
                <div className="mt-4 pt-3 border-t">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Profit</span>
                    <span className="font-medium text-emerald-600">{formatCurrency(totalProfit)} XAF</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Customer */}
            <Card className="p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" /> Customer
              </h3>
              {sale.customer ? (
                <div>
                  <p className="text-sm font-medium">{sale.customer.name}</p>
                  <p className="text-xs text-gray-500">{sale.customer.phone}</p>
                  {sale.customer.isVIP && <Badge className="bg-amber-100 text-amber-700 text-xs mt-1">VIP</Badge>}
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium">{sale.customerName || "Walk-in Customer"}</p>
                  {sale.customerPhone && <p className="text-xs text-gray-500">{sale.customerPhone}</p>}
                </div>
              )}
            </Card>

            {/* Details */}
            <Card className="p-4">
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Created by</span>
                  <span>{sale.createdBy.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Created</span>
                  <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
                </div>
                {sale.completedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Completed</span>
                    <span>{new Date(sale.completedAt).toLocaleDateString()}</span>
                  </div>
                )}
                {sale.notes && (
                  <div className="pt-2 border-t">
                    <p className="text-gray-500 text-xs mb-1">Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{sale.notes}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

          {/* Payment Modal */}
          <PaymentModal
            open={showPayment}
            onClose={() => setShowPayment(false)}
            saleId={sale.id}
            saleNumber={sale.saleNumber}
            totalAmount={totalAmount}
            amountDue={amountDue}
            onSuccess={handlePaymentSuccess}
          />
        </div>
      </div>
    </div>
  );
}
