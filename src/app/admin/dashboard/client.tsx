"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, DollarSign, Wrench, Contact, ClipboardList, Clock, CheckCircle, Activity, BarChart3, TrendingUp } from "lucide-react";

type Props = {
  admin: {
    id: string;
    username: string;
    avatar: string | null;
    role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  };
  stats: {
    total: number;
    admins: number;
    cashiers: number;
    technicians: number;
  };
  customerStats: {
    total: number;
    vip: number;
    regular: number;
  };
  ticketStats: {
    total: number;
    pending: number;
    inProgress: number;
    completedToday: number;
    completedThisWeek: number;
    revenueThisMonth: number;
  };
};

export function AdminDashboardClient({ admin, stats, customerStats, ticketStats }: Props) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={admin.role} username={admin.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Admin Dashboard"
          subtitle="Overview of your system"
          username={admin.username}
          avatar={admin.avatar}
          role={admin.role}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* User Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/admin/users">
              <StatsCard title="Total Users" value={stats.total} icon={Users} color="blue" delay={0} />
            </Link>
            <StatsCard title="Admins" value={stats.admins} icon={Shield} color="purple" delay={0.1} />
            <StatsCard title="Cashiers" value={stats.cashiers} icon={DollarSign} color="emerald" delay={0.2} />
            <StatsCard title="Technicians" value={stats.technicians} icon={Wrench} color="amber" delay={0.3} />
            <Link href="/admin/customers">
              <StatsCard title="Customers" value={customerStats.total} icon={Contact} color="blue" delay={0.4} />
            </Link>
          </div>

          {/* Ticket Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/admin/tickets">
              <StatsCard title="Total Tickets" value={ticketStats.total} icon={ClipboardList} color="blue" delay={0.5} />
            </Link>
            <StatsCard title="Pending" value={ticketStats.pending} icon={Clock} color="amber" delay={0.6} />
            <StatsCard title="In Progress" value={ticketStats.inProgress} icon={Wrench} color="purple" delay={0.7} />
            <StatsCard title="Completed Today" value={ticketStats.completedToday} icon={CheckCircle} color="emerald" delay={0.8} />
            <StatsCard title="Revenue (Month)" value={ticketStats.revenueThisMonth} icon={DollarSign} color="blue" delay={0.9} />
          </div>

          {/* Placeholder cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="w-5 h-5 text-blue-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <Activity className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Activity Feed</p>
                    <p className="text-xs text-gray-400 mt-1">Recent system activity will appear here</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <BarChart3 className="w-5 h-5 text-emerald-500" />
                    Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                    <TrendingUp className="w-12 h-12 mb-3 text-gray-300" />
                    <p className="text-sm font-medium text-gray-500">Analytics Dashboard</p>
                    <p className="text-xs text-gray-400 mt-1">Charts and reports will appear here</p>
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
