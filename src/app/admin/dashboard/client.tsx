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
  TrendingUp, TrendingDown, ShoppingCart, ClipboardList, DollarSign, Clock,
  Users, Package, AlertTriangle, Activity, Trophy, Wrench, CreditCard,
  Zap, Plus, BarChart3, Contact, Eye,
} from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

const CHART_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6"];
const STATUS_COLORS: Record<string, string> = {
  PENDING: "#f59e0b",
  IN_DIAGNOSTICS: "#3b82f6",
  IN_PROGRESS: "#8b5cf6",
  COMPLETED: "#10b981",
  CANCELLED: "#ef4444",
};

type Props = {
  admin: { id: string; username: string; avatar: string | null; role: "ADMIN" | "CASHIER" | "TECHNICIAN" };
  financial: {
    totalProfit: number; salesProfit: number; ticketProfit: number;
    combinedRevenue: number; profitChangePercent: number;
  };
  todayStats: {
    salesToday: number; salesRevenueToday: number; ticketsToday: number;
    ticketsCompletedToday: number; revenueToday: number; pendingToday: number;
    revenueVsYesterday: number;
  };
  systemCounts: {
    totalCustomers: number; customersToday: number; totalTickets: number;
    ticketsToday: number; totalProducts: number; productsInStock: number;
    totalSales: number; salesToday: number; totalUsers: number; stockAlerts: number;
  };
  revenueChart: Array<{ month: string; salesRevenue: number; ticketRevenue: number }>;
  dailySalesChart: Array<{ day: string; sales: number; tickets: number }>;
  ticketStatusChart: Array<{ status: string; count: number }>;
  paymentMethodChart: Array<{ name: string; value: number }>;
  stockAlerts: Array<{ id: string; name: string; sku: string; quantity: number; reorderLevel: number }>;
  recentActivity: Array<{ type: string; id: string; title: string; subtitle: string; time: string; status?: string }>;
  topProducts: Array<{ rank: number; name: string; sold: number; revenue: number }>;
  topTechnicians: Array<{ rank: number; name: string; repairs: number; revenue: number }>;
  creditData: { sales: Array<{ id: string; saleNumber: string; customerName: string; amountDue: number }>; totalOutstanding: number; totalCount: number };
};

function TrendBadge({ value, label }: { value: number; label?: string }) {
  const isPositive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? "+" : ""}{value}%{label ? ` ${label}` : ""}
    </span>
  );
}

function StatCardLarge({
  title, value, subValue, icon: Icon, iconBg, iconColor, trend, trendLabel, href,
}: {
  title: string; value: string; subValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string; iconColor: string;
  trend?: number; trendLabel?: string; href?: string;
}) {
  const content = (
    <Card className="p-5 hover:shadow-md transition-all duration-200 cursor-pointer group">
      <div className="flex items-start justify-between">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend !== undefined && <TrendBadge value={trend} label={trendLabel} />}
      </div>
      <p className="text-2xl font-bold text-gray-900 mt-3">{value}</p>
      <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
      {subValue && <p className="text-xs text-gray-400 mt-0.5">{subValue}</p>}
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function MiniStatCard({
  title, value, subValue, icon: Icon, iconBg, iconColor, href,
}: {
  title: string; value: string | number; subValue?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string; iconColor: string; href?: string;
}) {
  const content = (
    <Card className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{title}</p>
          {subValue && <p className="text-xs text-gray-400">{subValue}</p>}
        </div>
      </div>
    </Card>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

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

const activityIcons: Record<string, string> = { sale: "cart", ticket: "ticket", customer: "user" };

export function AdminDashboardClient({
  admin, financial, todayStats, systemCounts, revenueChart,
  dailySalesChart, ticketStatusChart, paymentMethodChart,
  stockAlerts, recentActivity, topProducts, topTechnicians, creditData,
}: Props) {
  const f = (n: number) => formatCurrency(n) + " XAF";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={admin.role} username={admin.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Admin Dashboard" subtitle="Overview of your system" username={admin.username} avatar={admin.avatar} role={admin.role} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-auto">
          {/* Greeting */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-lg font-semibold text-gray-800">{getGreeting()}, {admin.username}!</p>
            <p className="text-sm text-gray-500">{today}</p>
          </motion.div>

          {/* Row 1: Financial Overview */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardLarge title="Total Profit" value={f(financial.totalProfit)} icon={DollarSign}
              iconBg="bg-emerald-100" iconColor="text-emerald-600"
              trend={financial.profitChangePercent} trendLabel="vs last month" />
            <StatCardLarge title="Sales Profit" value={f(financial.salesProfit)} icon={ShoppingCart}
              iconBg="bg-indigo-100" iconColor="text-indigo-600"
              subValue={`${((financial.salesProfit / (financial.totalProfit || 1)) * 100).toFixed(0)}% of total`} />
            <StatCardLarge title="Ticket Profit" value={f(financial.ticketProfit)} icon={Wrench}
              iconBg="bg-purple-100" iconColor="text-purple-600"
              subValue={`${((financial.ticketProfit / (financial.totalProfit || 1)) * 100).toFixed(0)}% of total`} />
            <StatCardLarge title="Combined Revenue" value={f(financial.combinedRevenue)} icon={BarChart3}
              iconBg="bg-blue-100" iconColor="text-blue-600" />
          </motion.div>

          {/* Row 2: Today's Activity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCardLarge title="Sales Today" value={String(todayStats.salesToday)} icon={ShoppingCart}
              iconBg="bg-indigo-100" iconColor="text-indigo-600"
              subValue={`${f(todayStats.salesRevenueToday)} revenue`} href="/admin/sales" />
            <StatCardLarge title="Tickets Today" value={String(todayStats.ticketsToday)} icon={ClipboardList}
              iconBg="bg-blue-100" iconColor="text-blue-600"
              subValue={`${todayStats.ticketsCompletedToday} completed`} href="/admin/tickets" />
            <StatCardLarge title="Revenue Today" value={f(todayStats.revenueToday)} icon={DollarSign}
              iconBg="bg-emerald-100" iconColor="text-emerald-600"
              subValue={`vs ${f(todayStats.revenueVsYesterday)} yesterday`} />
            <StatCardLarge title="Pending Today" value={String(todayStats.pendingToday)} icon={Clock}
              iconBg="bg-amber-100" iconColor="text-amber-600" subValue="need attention" />
          </motion.div>

          {/* Row 3: System Counts */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <MiniStatCard title="Customers" value={systemCounts.totalCustomers} icon={Contact}
              iconBg="bg-blue-100" iconColor="text-blue-600"
              subValue={`+${systemCounts.customersToday} today`} href="/admin/customers" />
            <MiniStatCard title="Tickets" value={systemCounts.totalTickets} icon={ClipboardList}
              iconBg="bg-purple-100" iconColor="text-purple-600"
              subValue={`+${systemCounts.ticketsToday} today`} href="/admin/tickets" />
            <MiniStatCard title="Products" value={systemCounts.totalProducts} icon={Package}
              iconBg="bg-indigo-100" iconColor="text-indigo-600"
              subValue={`${systemCounts.productsInStock} in stock`} href="/admin/inventory" />
            <MiniStatCard title="Sales" value={systemCounts.totalSales} icon={ShoppingCart}
              iconBg="bg-emerald-100" iconColor="text-emerald-600"
              subValue="all time" href="/admin/sales" />
            <MiniStatCard title="Users" value={systemCounts.totalUsers} icon={Users}
              iconBg="bg-amber-100" iconColor="text-amber-600"
              subValue="active" href="/admin/users" />
            <MiniStatCard title="Alerts" value={systemCounts.stockAlerts} icon={AlertTriangle}
              iconBg="bg-red-100" iconColor="text-red-600"
              subValue="low stock" href="/admin/inventory/alerts" />
          </motion.div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <ChartWrapper title="Revenue Trend" icon={<TrendingUp className="w-5 h-5 text-indigo-500" />}>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={revenueChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                      <Tooltip formatter={(v) => `${formatCurrency(Number(v))} XAF`} />
                      <Legend />
                      <Line type="monotone" dataKey="salesRevenue" stroke="#6366f1" name="Sales" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="ticketRevenue" stroke="#10b981" name="Tickets" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </ChartWrapper>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <ChartWrapper title="Payment Methods (This Month)" icon={<DollarSign className="w-5 h-5 text-emerald-500" />}>
                <div className="h-[300px]">
                  {paymentMethodChart.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={paymentMethodChart} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                          {paymentMethodChart.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => `${formatCurrency(Number(v))} XAF`} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">No payment data this month</div>
                  )}
                </div>
              </ChartWrapper>
            </motion.div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <ChartWrapper title="Daily Revenue (Last 7 Days)" icon={<BarChart3 className="w-5 h-5 text-indigo-500" />}>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailySalesChart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : v} />
                      <Tooltip formatter={(v) => `${formatCurrency(Number(v))} XAF`} />
                      <Legend />
                      <Bar dataKey="sales" fill="#6366f1" name="Sales" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="tickets" fill="#10b981" name="Tickets" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </ChartWrapper>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
              <ChartWrapper title="Ticket Status Overview" icon={<ClipboardList className="w-5 h-5 text-purple-500" />}>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={ticketStatusChart} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="count" nameKey="status"
                        label={({ name, percent }) => `${String(name ?? "").replace(/_/g, " ")} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                        {ticketStatusChart.map((entry, i) => (
                          <Cell key={i} fill={STATUS_COLORS[entry.status] || CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </ChartWrapper>
            </motion.div>
          </div>

          {/* Widgets Row 1: Stock Alerts + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="w-5 h-5 text-amber-500" />
                      Stock Alerts ({stockAlerts.length})
                    </CardTitle>
                    <Link href="/admin/inventory/alerts">
                      <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stockAlerts.length > 0 ? stockAlerts.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${p.quantity === 0 ? "bg-red-500" : "bg-amber-500"}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.sku}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className={`text-xs ${p.quantity === 0 ? "border-red-200 text-red-700 bg-red-50" : "border-amber-200 text-amber-700 bg-amber-50"}`}>
                          {p.quantity === 0 ? "Out of Stock" : `${p.quantity} left`}
                        </Badge>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No stock alerts</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Activity className="w-5 h-5 text-blue-500" />
                      Recent Activity
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1">
                  {recentActivity.length > 0 ? recentActivity.map((a, i) => (
                    <div key={i} className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        a.type === "sale" ? "bg-indigo-100" : a.type === "ticket" ? "bg-blue-100" : "bg-emerald-100"
                      }`}>
                        {a.type === "sale" ? <ShoppingCart className="w-4 h-4 text-indigo-600" /> :
                         a.type === "ticket" ? <ClipboardList className="w-4 h-4 text-blue-600" /> :
                         <Contact className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{a.title}</p>
                        <p className="text-xs text-gray-500">{a.subtitle}</p>
                      </div>
                      <span className="text-xs text-gray-400 shrink-0">{timeAgo(a.time)}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Widgets Row 2: Top Products + Top Technicians */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Trophy className="w-5 h-5 text-amber-500" />
                      Top Products This Month
                    </CardTitle>
                    <Link href="/admin/sales/reports">
                      <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topProducts.length > 0 ? topProducts.map((p) => (
                    <div key={p.rank} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          p.rank <= 3 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                        }`}>{p.rank}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.sold} sold</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{f(p.revenue)}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No sales this month</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Wrench className="w-5 h-5 text-purple-500" />
                    Top Technicians This Month
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {topTechnicians.length > 0 ? topTechnicians.map((t) => (
                    <div key={t.rank} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          t.rank <= 3 ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"
                        }`}>{t.rank}</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-500">{t.repairs} repairs</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{f(t.revenue)}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No completed repairs this month</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Widgets Row 3: Credit Sales + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.2 }}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="w-5 h-5 text-red-500" />
                      Outstanding Credit ({creditData.totalCount})
                    </CardTitle>
                    <Link href="/admin/sales/credit">
                      <Button variant="ghost" size="sm" className="text-xs">Collect</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {creditData.sales.length > 0 ? (
                    <>
                      {creditData.sales.map((s) => (
                        <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{s.customerName}</p>
                            <p className="text-xs text-gray-500">{s.saleNumber}</p>
                          </div>
                          <p className="text-sm font-semibold text-red-600">{f(s.amountDue)}</p>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                        <p className="text-base font-bold text-red-600">{f(creditData.totalOutstanding)}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-8">No outstanding credit</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.3 }}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Zap className="w-5 h-5 text-amber-500" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <Link href="/admin/sales/pos">
                      <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                        <Plus className="w-4 h-4" /><span className="text-xs">New Sale</span>
                      </Button>
                    </Link>
                    <Link href="/admin/tickets/create">
                      <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                        <Plus className="w-4 h-4" /><span className="text-xs">New Ticket</span>
                      </Button>
                    </Link>
                    <Link href="/admin/customers">
                      <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                        <Contact className="w-4 h-4" /><span className="text-xs">Customers</span>
                      </Button>
                    </Link>
                    <Link href="/admin/inventory/products/new">
                      <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                        <Package className="w-4 h-4" /><span className="text-xs">Add Product</span>
                      </Button>
                    </Link>
                    <Link href="/admin/sales/reports">
                      <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                        <BarChart3 className="w-4 h-4" /><span className="text-xs">Reports</span>
                      </Button>
                    </Link>
                    <Link href="/admin/users">
                      <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                        <Users className="w-4 h-4" /><span className="text-xs">Users</span>
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
