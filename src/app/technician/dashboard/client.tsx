"use client";

import { motion } from "framer-motion";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, ClipboardList, Clock, CheckCircle2 } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";

type Props = {
  user: {
    username: string;
    avatar: string | null;
    role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  };
};

export function TechnicianDashboardClient({ user }: Props) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} username={user.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Technician Dashboard"
          subtitle={`Welcome back, ${user.username}`}
          username={user.username}
          avatar={user.avatar}
          role={user.role}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Active Jobs" value={0} icon={Wrench} color="amber" delay={0} />
            <StatsCard title="Work Orders" value={0} icon={ClipboardList} color="blue" delay={0.1} />
            <StatsCard title="Pending" value={0} icon={Clock} color="purple" delay={0.2} />
            <StatsCard title="Completed" value={0} icon={CheckCircle2} color="emerald" delay={0.3} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Work Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Wrench className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">Technician Module</p>
                  <p className="text-sm text-gray-400 mt-1">Work orders and service tickets will appear here</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
