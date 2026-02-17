"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { getSalesReport } from "@/actions/sale";
import { formatCurrency, PAYMENT_METHODS } from "@/lib/sales-constants";
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  BarChart3,
  ShoppingCart,
  Target,
  Filter,
} from "lucide-react";
import Link from "next/link";

type Report = {
  totalSales: number;
  totalRevenue: number;
  totalProfit: number;
  avgOrderValue: number;
  profitMargin: number;
  byMethod: Record<string, { count: number; total: number }>;
  topProducts: { name: string; quantity: number; revenue: number }[];
};

type Props = {
  user: { username: string; avatar: string | null; role: string };
  initialReport: Report | null;
  basePath: string;
};

export function SalesReportClient({ user, initialReport, basePath }: Props) {
  const [report, setReport] = useState(initialReport);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchReport = () => {
    startTransition(async () => {
      const result = await getSalesReport({
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setReport(result as Report | null);
    });
  };

  const getMethodLabel = (method: string) =>
    PAYMENT_METHODS.find((m) => m.value === method)?.label || method;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role as "ADMIN" | "CASHIER" | "TECHNICIAN"} username={user.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Sales Reports" subtitle="Analytics and insights" username={user.username} avatar={user.avatar} role={user.role as "ADMIN" | "CASHIER" | "TECHNICIAN"} />

        <div className="p-4 lg:p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Link href={`${basePath}/sales`}>
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Sales</Button>
          </Link>
        </div>

        {/* Date Filter */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div>
              <Label className="text-xs">From Date</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">To Date</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1" />
            </div>
            <Button onClick={fetchReport} disabled={isPending}>
              <Filter className="w-4 h-4 mr-2" /> {isPending ? "Loading..." : "Apply Filter"}
            </Button>
            <Button
              variant="outline"
              onClick={() => { setDateFrom(""); setDateTo(""); fetchReport(); }}
              disabled={isPending}
            >
              Reset
            </Button>
          </div>
        </Card>

        {report ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <StatsCard title="Total Sales" value={report.totalSales.toString()} icon={ShoppingCart} color="blue" delay={0} />
              <StatsCard title="Revenue" value={`${formatCurrency(report.totalRevenue)} XAF`} icon={DollarSign} color="emerald" delay={0.1} />
              <StatsCard title="Profit" value={`${formatCurrency(report.totalProfit)} XAF`} icon={TrendingUp} color="emerald" delay={0.2} />
              <StatsCard title="Avg Order" value={`${formatCurrency(report.avgOrderValue)} XAF`} icon={BarChart3} color="purple" delay={0.3} />
              <StatsCard title="Margin" value={`${report.profitMargin.toFixed(1)}%`} icon={Target} color="amber" delay={0.4} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods */}
              <Card className="p-4">
                <h3 className="font-bold text-gray-900 mb-4">Payment Methods</h3>
                {Object.keys(report.byMethod).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No payment data</p>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(report.byMethod).map(([method, data]) => {
                      const percent = report.totalRevenue > 0 ? (data.total / report.totalRevenue) * 100 : 0;
                      return (
                        <div key={method} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{getMethodLabel(method)}</span>
                            <span>{formatCurrency(data.total)} XAF ({data.count})</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Top Products */}
              <Card className="p-4">
                <h3 className="font-bold text-gray-900 mb-4">Top Products</h3>
                {report.topProducts.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">No product data</p>
                ) : (
                  <div className="space-y-3">
                    {report.topProducts.map((product, i) => (
                      <div key={product.name} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 text-xs flex items-center justify-center font-bold">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.quantity} sold</p>
                        </div>
                        <p className="text-sm font-bold">{formatCurrency(product.revenue)} XAF</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No report data available</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
