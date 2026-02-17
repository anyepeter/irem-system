"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChartWrapper } from "@/components/dashboard/chart-wrapper";
import { formatCurrency } from "@/lib/sales-constants";
import {
  ShoppingCart, ClipboardList, DollarSign, CreditCard, Banknote, Smartphone,
  BarChart3, AlertTriangle, Zap, Plus, Contact, Package, Eye, Clock,
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];

type Props = {
  user: { username: string; avatar: string | null; role: "ADMIN" | "CASHIER" | "TECHNICIAN" };
  todayStats: {
    salesToday: number; revenueToday: number; ticketsToday: number;
    creditDue: number; creditCount: number;
    yesterdaySales: number; yesterdayRevenue: number;
  } | null;
  monthStats: {
    revenueThisMonth: number; transactionsThisMonth: number;
    cashToday: number; cashCount: number;
    momoToday: number; momoCount: number;
  } | null;
  hourlySales: Array<{ hour: string; revenue: number; count: number }>;
  weeklySales: Array<{ day: string; revenue: number }>;
  paymentBreakdown: Array<{ name: string; value: number }>;
  recentSales: Array<{ id: string; saleNumber: string; customerName: string; totalAmount: number; paymentStatus: string; createdAt: string }>;
  pendingFees: Array<{ id: string; ticketNumber: string; customerName: string; device: string; fee: number }>;
  stockAlerts: Array<{ id: string; name: string; sku: string; quantity: number; reorderLevel: number }>;
  creditSales: { sales: Array<{ id: string; saleNumber: string; customerName: string; amountDue: number }>; totalOutstanding: number; totalCount: number };
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function CashierDashboardClient({
  user, todayStats, monthStats, hourlySales, weeklySales,
  paymentBreakdown, recentSales, pendingFees, stockAlerts, creditSales,
}: Props) {
  const f = (n: number) => formatCurrency(n) + " XAF";
  const ts = todayStats || { salesToday: 0, revenueToday: 0, ticketsToday: 0, creditDue: 0, creditCount: 0, yesterdaySales: 0, yesterdayRevenue: 0 };
  const ms = monthStats || { revenueThisMonth: 0, transactionsThisMonth: 0, cashToday: 0, cashCount: 0, momoToday: 0, momoCount: 0 };
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} username={user.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Cashier Dashboard" subtitle={`Welcome back, ${user.username}`} username={user.username} avatar={user.avatar} role={user.role} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-auto">
          {/* Greeting */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-lg font-semibold text-gray-800">{getGreeting()}, {user.username}!</p>
            <p className="text-sm text-gray-500">{today}</p>
          </motion.div>

          {/* Row 1: Today's Performance */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-indigo-100">
                  <ShoppingCart className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{ts.salesToday}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Sales Today</p>
              <p className="text-xs text-gray-400">vs {ts.yesterdaySales} yesterday</p>
            </Card>

            <Card className="p-5 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-100">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{f(ts.revenueToday)}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Revenue Today</p>
              <p className="text-xs text-gray-400">vs {f(ts.yesterdayRevenue)} yesterday</p>
            </Card>

            <Card className="p-5 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-100">
                <ClipboardList className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{ts.ticketsToday}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Tickets Today</p>
              <p className="text-xs text-gray-400">processed</p>
            </Card>

            <Card className="p-5 hover:shadow-md transition-all">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-red-100">
                <CreditCard className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{f(ts.creditDue)}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Credit Sales Due</p>
              <p className="text-xs text-gray-400">{ts.creditCount} outstanding</p>
            </Card>
          </motion.div>

          {/* Row 2: Financial Summary */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{f(ms.revenueThisMonth)}</p>
                  <p className="text-xs text-gray-500">This Month</p>
                  <p className="text-xs text-gray-400">{ms.transactionsThisMonth} transactions</p>
                </div>
              </div>
            </Card>

            <Card className="p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100">
                  <Banknote className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{f(ms.cashToday)}</p>
                  <p className="text-xs text-gray-500">Cash Today</p>
                  <p className="text-xs text-gray-400">{ms.cashCount} transactions</p>
                </div>
              </div>
            </Card>

            <Card className="p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100">
                  <Smartphone className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{f(ms.momoToday)}</p>
                  <p className="text-xs text-gray-500">MoMo Today</p>
                  <p className="text-xs text-gray-400">{ms.momoCount} transactions</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <ChartWrapper title="Today's Sales by Hour" icon={<Clock className="w-5 h-5 text-indigo-500" />}>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={hourlySales}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                      <Tooltip formatter={(v) => `${formatCurrency(Number(v))} XAF`} />
                      <Bar dataKey="revenue" fill="#6366f1" name="Revenue" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartWrapper>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <ChartWrapper title="Payment Methods (Today)" icon={<DollarSign className="w-5 h-5 text-emerald-500" />}>
                <div className="h-[250px]">
                  {paymentBreakdown.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value"
                          label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                          {paymentBreakdown.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => `${formatCurrency(Number(v))} XAF`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">No payments today yet</div>
                  )}
                </div>
              </ChartWrapper>
            </motion.div>
          </div>

          {/* Weekly Chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <ChartWrapper title="This Week's Revenue" icon={<BarChart3 className="w-5 h-5 text-indigo-500" />}>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklySales}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                    <Tooltip formatter={(v) => `${formatCurrency(Number(v))} XAF`} />
                    <Bar dataKey="revenue" fill="#6366f1" name="Revenue" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartWrapper>
          </motion.div>

          {/* Widgets Row 1: Recent Sales + Pending Diagnostic Fees */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ShoppingCart className="w-5 h-5 text-indigo-500" />
                      Recent Sales (Today)
                    </CardTitle>
                    <Link href="/cashier/sales">
                      <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {recentSales.length > 0 ? recentSales.map((s) => (
                    <Link key={s.id} href={`/cashier/sales/${s.id}`}>
                      <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{s.saleNumber} &middot; {s.customerName}</p>
                          <p className="text-xs text-gray-400">{timeAgo(s.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{f(s.totalAmount)}</p>
                          <Badge variant="outline" className={`text-xs ${s.paymentStatus === "PAID" ? "border-green-200 text-green-700 bg-green-50" : "border-amber-200 text-amber-700 bg-amber-50"}`}>
                            {s.paymentStatus === "PAID" ? "Paid" : "Pending"}
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No sales today yet</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ClipboardList className="w-5 h-5 text-blue-500" />
                      Pending Diagnostic Fees ({pendingFees.length})
                    </CardTitle>
                    <Link href="/cashier/tickets">
                      <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingFees.length > 0 ? pendingFees.map((t) => (
                    <Link key={t.id} href={`/cashier/tickets/${t.id}`}>
                      <div className="py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900">{t.ticketNumber} &middot; {t.customerName}</p>
                          <Badge variant="outline" className="text-xs border-red-200 text-red-700 bg-red-50">
                            {f(t.fee)} unpaid
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{t.device}</p>
                      </div>
                    </Link>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No pending diagnostic fees</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Widgets Row 2: Credit Sales + Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="w-5 h-5 text-red-500" />
                      Credit Sales Due ({creditSales.totalCount})
                    </CardTitle>
                    <Link href="/cashier/sales/credit">
                      <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {creditSales.sales.length > 0 ? (
                    <>
                      {creditSales.sales.map((s) => (
                        <Link key={s.id} href={`/cashier/sales/${s.id}`}>
                          <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{s.customerName}</p>
                              <p className="text-xs text-gray-500">{s.saleNumber}</p>
                            </div>
                            <p className="text-sm font-semibold text-red-600">{f(s.amountDue)}</p>
                          </div>
                        </Link>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                        <p className="text-base font-bold text-red-600">{f(creditSales.totalOutstanding)}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-8">No outstanding credit</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Stock Alerts ({stockAlerts.length})
                    </CardTitle>
                    <Link href="/cashier/inventory/alerts">
                      <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stockAlerts.length > 0 ? stockAlerts.slice(0, 5).map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${p.quantity === 0 ? "bg-red-500" : "bg-amber-500"}`} />
                        <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs ${p.quantity === 0 ? "border-red-200 text-red-700 bg-red-50" : "border-amber-200 text-amber-700 bg-amber-50"}`}>
                        {p.quantity === 0 ? "OUT OF STOCK" : `${p.quantity} remaining`}
                      </Badge>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No stock alerts</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <Link href="/cashier/sales/pos">
                    <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                      <Plus className="w-4 h-4" /><span className="text-xs">New Sale</span>
                    </Button>
                  </Link>
                  <Link href="/cashier/tickets/create">
                    <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                      <Plus className="w-4 h-4" /><span className="text-xs">New Ticket</span>
                    </Button>
                  </Link>
                  <Link href="/cashier/customers">
                    <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                      <Contact className="w-4 h-4" /><span className="text-xs">Customers</span>
                    </Button>
                  </Link>
                  <Link href="/cashier/sales">
                    <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                      <Eye className="w-4 h-4" /><span className="text-xs">View Sales</span>
                    </Button>
                  </Link>
                  <Link href="/cashier/sales/credit">
                    <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                      <CreditCard className="w-4 h-4" /><span className="text-xs">Credit Sales</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
