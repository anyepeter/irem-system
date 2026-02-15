"use client";

import { motion } from "framer-motion";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { CreateUserDialog } from "@/components/dashboard/create-user-dialog";
import { UserTable } from "@/components/dashboard/user-table";
import { Users, Shield, DollarSign, Wrench } from "lucide-react";

type Props = {
  admin: {
    id: string;
    username: string;
    avatar: string | null;
    role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  };
  users: Array<{
    id: string;
    clerkId: string;
    username: string;
    email: string;
    password: string;
    phone: string;
    avatar: string | null;
    role: "ADMIN" | "CASHIER" | "TECHNICIAN";
    createdAt: Date;
    updatedAt: Date;
  }>;
  stats: {
    total: number;
    admins: number;
    cashiers: number;
    technicians: number;
  };
};

export function AdminDashboardClient({ admin, users, stats }: Props) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={admin.role} username={admin.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Admin Dashboard"
          subtitle="Manage your team and system settings"
          username={admin.username}
          avatar={admin.avatar}
          role={admin.role}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Total Users" value={stats.total} icon={Users} color="blue" delay={0} />
            <StatsCard title="Admins" value={stats.admins} icon={Shield} color="purple" delay={0.1} />
            <StatsCard title="Cashiers" value={stats.cashiers} icon={DollarSign} color="emerald" delay={0.2} />
            <StatsCard title="Technicians" value={stats.technicians} icon={Wrench} color="amber" delay={0.3} />
          </div>

          {/* Users section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Team Members</h2>
                <p className="text-sm text-gray-500">Manage your organization&apos;s users</p>
              </div>
              <CreateUserDialog />
            </div>

            <UserTable users={users} currentUserId={admin.id} />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
