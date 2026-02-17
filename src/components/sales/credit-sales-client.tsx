"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { PaymentModal } from "./payment-modal";
import { getCreditSales } from "@/actions/sale";
import { formatCurrency, PAYMENT_STATUS_COLORS } from "@/lib/sales-constants";
import {
  ArrowLeft,
  CreditCard,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Sale = {
  id: string;
  saleNumber: string;
  customerName: string | null;
  customerPhone: string | null;
  saleType: string;
  totalAmount: number | { toString(): string };
  amountPaid: number | { toString(): string };
  amountDue: number | { toString(): string };
  paymentStatus: string;
  status: string;
  createdAt: string | Date;
  customer: { id: number; name: string; phone: string } | null;
  createdBy: { username: string };
};

type Props = {
  user: { username: string; avatar: string | null; role: string };
  initialSales: Sale[];
  initialTotal: number;
  basePath: string;
};

export function CreditSalesClient({ user, initialSales, initialTotal, basePath }: Props) {
  const router = useRouter();
  const [sales, setSales] = useState(initialSales);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const [paymentSale, setPaymentSale] = useState<Sale | null>(null);
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const totalDue = sales.reduce((sum, s) => sum + Number(s.amountDue), 0);

  const fetchSales = (newPage: number) => {
    setPage(newPage);
    startTransition(async () => {
      const result = await getCreditSales({ page: newPage, limit });
      setSales(result.sales as unknown as Sale[]);
      setTotal(result.total);
    });
  };

  const handlePaymentSuccess = () => {
    setPaymentSale(null);
    router.refresh();
    fetchSales(page);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role as "ADMIN" | "CASHIER" | "TECHNICIAN"} username={user.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Credit Sales" subtitle="Manage unpaid credit sales" username={user.username} avatar={user.avatar} role={user.role as "ADMIN" | "CASHIER" | "TECHNICIAN"} />

        <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link href={`${basePath}/sales`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Sales</Button>
          </Link>
          <div className="text-right">
            <p className="text-xs text-gray-500">Total Outstanding</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(totalDue)} XAF</p>
          </div>
        </div>

        <Card className={isPending ? "opacity-50" : ""}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sale #</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Paid</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Due</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => {
                  const paymentColor = PAYMENT_STATUS_COLORS[sale.paymentStatus] || PAYMENT_STATUS_COLORS.UNPAID;
                  const customerDisplay = sale.customer?.name || sale.customerName || "Walk-in";
                  return (
                    <tr key={sale.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-sm font-medium">{sale.saleNumber}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm">{customerDisplay}</p>
                        <p className="text-xs text-gray-500">{sale.customer?.phone || sale.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm">{formatCurrency(Number(sale.totalAmount))} XAF</td>
                      <td className="px-4 py-3 text-sm text-emerald-600">{formatCurrency(Number(sale.amountPaid))} XAF</td>
                      <td className="px-4 py-3 text-sm font-medium text-red-600">{formatCurrency(Number(sale.amountDue))} XAF</td>
                      <td className="px-4 py-3">
                        <Badge className={`${paymentColor.bg} ${paymentColor.text} text-xs`}>
                          {sale.paymentStatus.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{new Date(sale.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPaymentSale(sale)}
                            className="text-emerald-600"
                          >
                            <DollarSign className="w-4 h-4" />
                          </Button>
                          <Link href={`${basePath}/sales/${sale.id}`}>
                            <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sales.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">
                      No outstanding credit sales
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => fetchSales(page - 1)}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages || isPending} onClick={() => fetchSales(page + 1)}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

        {paymentSale && (
          <PaymentModal
            open={!!paymentSale}
            onClose={() => setPaymentSale(null)}
            saleId={paymentSale.id}
            saleNumber={paymentSale.saleNumber}
            totalAmount={Number(paymentSale.totalAmount)}
            amountDue={Number(paymentSale.amountDue)}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}
