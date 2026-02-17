"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/sales-constants";
import {
  ClipboardList, Clock, Wrench, CheckCircle2, AlertTriangle,
  Timer, Star, Zap, Eye, ArrowRight, Package,
} from "lucide-react";

type Props = {
  user: {
    username: string;
    avatar: string | null;
    role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  };
  stats: {
    totalAssignedTickets: number;
    pendingDiagnostics: number;
    inProgress: number;
    completedThisMonth: number;
    awaitingApproval: number;
    avgCompletionTime: number;
  };
  urgentTickets: Array<{
    id: string; ticketNumber: string; priority: string; status: string;
    device: string; customerName: string; createdAt: string;
  }>;
  pendingAction: Array<{
    id: string; ticketNumber: string; status: string;
    device: string; issue: string; customerName: string; createdAt: string;
  }>;
  inProgressTickets: Array<{
    id: string; ticketNumber: string; status: string;
    device: string; customerName: string; updatedAt: string;
  }>;
  recentCompleted: Array<{
    id: string; ticketNumber: string; device: string;
    customerName: string; finalCost: number; completedAt: string;
  }>;
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

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_DIAGNOSTICS: "In Diagnostics",
  AWAITING_APPROVAL: "Awaiting Approval",
  APPROVED: "Approved",
  IN_PROGRESS: "In Progress",
  WAITING_FOR_PARTS: "Waiting for Parts",
  COMPLETED: "Completed",
};

const PRIORITY_COLORS: Record<string, string> = {
  URGENT: "bg-red-100 text-red-700 border-red-200",
  HIGH: "bg-orange-100 text-orange-700 border-orange-200",
  NORMAL: "bg-blue-100 text-blue-700 border-blue-200",
  LOW: "bg-gray-100 text-gray-700 border-gray-200",
};

export function TechnicianDashboardClient({
  user, stats, urgentTickets, pendingAction, inProgressTickets, recentCompleted,
}: Props) {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} username={user.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Technician Dashboard" subtitle="Your repair overview" username={user.username} avatar={user.avatar} role={user.role} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6 overflow-auto">
          {/* Greeting */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-lg font-semibold text-gray-800">{getGreeting()}, {user.username}!</p>
            <p className="text-sm text-gray-500">{today}</p>
          </motion.div>

          {/* Row 1: Main Stats (4 cards) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-blue-100 flex-shrink-0">
                  <ClipboardList className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{stats.totalAssignedTickets}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">My Tickets</p>
              <p className="text-xs text-gray-400">All assigned</p>
            </Card>

            <Card className="p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-amber-100 flex-shrink-0">
                  <Clock className="w-5 h-5 text-amber-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{stats.pendingDiagnostics}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Pending Diagnostics</p>
              <p className="text-xs text-gray-400">Need action</p>
            </Card>

            <Card className="p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-purple-100 flex-shrink-0">
                  <Wrench className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{stats.inProgress}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">In Progress</p>
              <p className="text-xs text-gray-400">Active repairs</p>
            </Card>

            <Card className="p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between gap-2">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center bg-emerald-100 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-3">{stats.completedThisMonth}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">Completed</p>
              <p className="text-xs text-gray-400">This month</p>
            </Card>
          </motion.div>

          {/* Row 2: Secondary Stats (3 cards) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-100 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900">{stats.awaitingApproval}</p>
                  <p className="text-xs text-gray-500">Awaiting Approval</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-indigo-100 flex-shrink-0">
                  <Timer className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900">{stats.avgCompletionTime} days</p>
                  <p className="text-xs text-gray-500">Avg Completion Time</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 hover:shadow-md transition-all">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-100 flex-shrink-0">
                  <Star className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-gray-900">{stats.completedThisMonth} repairs</p>
                  <p className="text-xs text-gray-500">This Month Performance</p>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Widgets Row 1: Urgent + Pending Action */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Urgent Tickets ({urgentTickets.length})
                    </CardTitle>
                    <Link href="/technician/my-tickets">
                      <Button variant="ghost" size="sm" className="text-xs">View All</Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {urgentTickets.length > 0 ? urgentTickets.map((t) => (
                    <Link key={t.id} href={`/technician/my-tickets/${t.id}`}>
                      <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{t.ticketNumber}</p>
                            <Badge variant="outline" className={`text-xs ${PRIORITY_COLORS[t.priority] || ""}`}>
                              {t.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{t.device} &middot; {t.customerName}</p>
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">{timeAgo(t.createdAt)}</span>
                      </div>
                    </Link>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No urgent tickets</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Clock className="w-5 h-5 text-amber-500" />
                      Awaiting My Action ({pendingAction.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pendingAction.length > 0 ? pendingAction.map((t) => (
                    <Link key={t.id} href={`/technician/my-tickets/${t.id}`}>
                      <div className="py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{t.ticketNumber}</p>
                            <Badge variant="outline" className="text-xs border-amber-200 text-amber-700 bg-amber-50">
                              {STATUS_LABELS[t.status] || t.status}
                            </Badge>
                          </div>
                          <span className="text-xs text-gray-400">{timeAgo(t.createdAt)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{t.device} &middot; {t.customerName}</p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{t.issue}</p>
                      </div>
                    </Link>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No pending actions</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Widgets Row 2: In Progress + Recently Completed */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Wrench className="w-5 h-5 text-purple-500" />
                      In Progress ({inProgressTickets.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {inProgressTickets.length > 0 ? inProgressTickets.map((t) => (
                    <Link key={t.id} href={`/technician/my-tickets/${t.id}`}>
                      <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{t.ticketNumber} &middot; {t.customerName}</p>
                          <p className="text-xs text-gray-500">{t.device}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          <Badge variant="outline" className="text-xs border-purple-200 text-purple-700 bg-purple-50">
                            {STATUS_LABELS[t.status] || t.status.replace(/_/g, " ")}
                          </Badge>
                          <span className="text-xs text-gray-400">{timeAgo(t.updatedAt)}</span>
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No tickets in progress</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      Recently Completed ({recentCompleted.length})
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentCompleted.length > 0 ? recentCompleted.map((t) => (
                    <Link key={t.id} href={`/technician/my-tickets/${t.id}`}>
                      <div className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900">{t.ticketNumber} &middot; {t.customerName}</p>
                          <p className="text-xs text-gray-500">{t.device}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <p className="text-sm font-semibold text-emerald-600">{formatCurrency(t.finalCost)} XAF</p>
                          <p className="text-xs text-gray-400">{timeAgo(t.completedAt)}</p>
                        </div>
                      </div>
                    </Link>
                  )) : (
                    <p className="text-sm text-gray-400 text-center py-8">No completions this week</p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Quick Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <Link href="/technician/my-tickets">
                    <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                      <ClipboardList className="w-4 h-4" /><span className="text-xs">My Tickets</span>
                    </Button>
                  </Link>
                  <Link href="/technician/inventory">
                    <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                      <Package className="w-4 h-4" /><span className="text-xs">Inventory</span>
                    </Button>
                  </Link>
                  <Link href="/technician/profile">
                    <Button variant="outline" className="w-full h-auto py-3 flex-col gap-1">
                      <Eye className="w-4 h-4" /><span className="text-xs">My Profile</span>
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
