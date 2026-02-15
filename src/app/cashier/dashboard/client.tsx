"use client";

import { motion } from "framer-motion";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Receipt, CreditCard } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";

type Props = {
  user: {
    username: string;
    avatar: string | null;
    role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  };
};

export function CashierDashboardClient({ user }: Props) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} username={user.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Cashier Dashboard"
          subtitle={`Welcome back, ${user.username}`}
          username={user.username}
          avatar={user.avatar}
          role={user.role}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard title="Today's Sales" value="$0.00" icon={DollarSign} color="emerald" delay={0} />
            <StatsCard title="Transactions" value={0} icon={Receipt} color="blue" delay={0.1} />
            <StatsCard title="Revenue" value="$0.00" icon={TrendingUp} color="purple" delay={0.2} />
            <StatsCard title="Payments" value={0} icon={CreditCard} color="amber" delay={0.3} />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Point of Sale</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <DollarSign className="w-16 h-16 mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-500">Cashier Module</p>
                  <p className="text-sm text-gray-400 mt-1">POS functionality will appear here</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
