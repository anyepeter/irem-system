"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { getSales } from "@/actions/sale";
import {
  formatCurrency,
  SALE_STATUS_COLORS,
  PAYMENT_STATUS_COLORS,
} from "@/lib/sales-constants";
import {
  Search,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import Link from "next/link";

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
  customer: { id: number; name: string; phone: string; isVIP: boolean } | null;
  createdBy: { username: string };
  _count: { items: number };
};

type Props = {
  user: { username: string; avatar: string | null; role: string };
  initialSales: Sale[];
  initialTotal: number;
  basePath: string;
};

export function SalesHistoryClient({ user, initialSales, initialTotal, basePath }: Props) {
  const [sales, setSales] = useState(initialSales);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchSales = (params: {
    search?: string;
    status?: string;
    paymentStatus?: string;
    saleType?: string;
    page?: number;
  }) => {
    startTransition(async () => {
      const result = await getSales({
        search: params.search || undefined,
        status: params.status || undefined,
        paymentStatus: params.paymentStatus || undefined,
        saleType: params.saleType || undefined,
        page: params.page || 1,
        limit,
      });
      setSales(result.sales as unknown as Sale[]);
      setTotal(result.total);
    });
  };

  const applyFilters = (overrides: Record<string, string | number> = {}) => {
    const params = {
      search: overrides.search !== undefined ? (overrides.search as string) : search,
      status: overrides.status !== undefined ? (overrides.status as string) : statusFilter,
      paymentStatus: overrides.paymentStatus !== undefined ? (overrides.paymentStatus as string) : paymentFilter,
      saleType: overrides.saleType !== undefined ? (overrides.saleType as string) : typeFilter,
      page: overrides.page !== undefined ? (overrides.page as number) : 1,
    };
    setPage(params.page);
    fetchSales(params);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role as "ADMIN" | "CASHIER" | "TECHNICIAN"} username={user.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Sales History" subtitle="All sales records" username={user.username} avatar={user.avatar} role={user.role as "ADMIN" | "CASHIER" | "TECHNICIAN"} />

        <div className="p-4 lg:p-6 space-y-6">
          <Link href={`${basePath}/sales`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Sales</Button>
          </Link>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by sale number, customer..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  applyFilters({ search: e.target.value });
                }}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); applyFilters({ status: v }); }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={paymentFilter} onValueChange={(v) => { setPaymentFilter(v); applyFilters({ paymentStatus: v }); }}>
              <SelectTrigger className="w-full sm:w-[170px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Payments</SelectItem>
                <SelectItem value="UNPAID">Unpaid</SelectItem>
                <SelectItem value="PARTIALLY_PAID">Partial</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); applyFilters({ saleType: v }); }}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="IN_SHOP">In Shop</SelectItem>
                <SelectItem value="CREDIT">Credit</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-500 self-center ml-auto">{total} total</span>
          </div>

          {/* Sales Table */}
          <Card className={isPending ? "opacity-50" : ""}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b bg-gray-50/50">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sale #</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Customer</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Items</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Paid</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Payment</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map((sale) => {
                    const statusColor = SALE_STATUS_COLORS[sale.status] || SALE_STATUS_COLORS.PENDING;
                    const paymentColor = PAYMENT_STATUS_COLORS[sale.paymentStatus] || PAYMENT_STATUS_COLORS.UNPAID;
                    const customerDisplay = sale.customer?.name || sale.customerName || "Walk-in";
                    return (
                      <tr key={sale.id} className="border-b hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-gray-900">{sale.saleNumber}</span>
                          {sale.saleType === "CREDIT" && (
                            <Badge variant="outline" className="ml-2 text-xs">Credit</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-gray-900">{customerDisplay}</p>
                          {sale.customer?.isVIP && (
                            <Badge className="bg-amber-100 text-amber-700 text-xs mt-0.5">VIP</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{sale._count.items}</td>
                        <td className="px-4 py-3 text-sm font-medium">{formatCurrency(Number(sale.totalAmount))} XAF</td>
                        <td className="px-4 py-3 text-sm">{formatCurrency(Number(sale.amountPaid))} XAF</td>
                        <td className="px-4 py-3">
                          <Badge className={`${statusColor.bg} ${statusColor.text} text-xs`}>
                            {sale.status.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`${paymentColor.bg} ${paymentColor.text} text-xs`}>
                            {sale.paymentStatus.replace("_", " ")}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(sale.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link href={`${basePath}/sales/${sale.id}`}>
                            <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                  {sales.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-400 text-sm">
                        No sales found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => applyFilters({ page: page - 1 })}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages || isPending} onClick={() => applyFilters({ page: page + 1 })}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
