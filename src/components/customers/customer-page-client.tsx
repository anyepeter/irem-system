"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { CustomerTable } from "./customer-table";
import { CustomerFormDialog } from "./customer-form-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getCustomers } from "@/actions/customer";
import {
  Users,
  Crown,
  UserPlus,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type Customer = {
  id: number;
  name: string;
  phone: string;
  address: string;
  isVIP: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { username: string };
};

type Props = {
  user: {
    username: string;
    avatar: string | null;
    role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  };
  initialCustomers: Customer[];
  initialTotal: number;
  stats: { total: number; vip: number; regular: number };
};

export function CustomerPageClient({
  user,
  initialCustomers,
  initialTotal,
  stats,
}: Props) {
  const canDelete = user.role === "ADMIN";
  const [customers, setCustomers] = useState(initialCustomers);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [createOpen, setCreateOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchCustomers = (params: {
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    startTransition(async () => {
      const result = await getCustomers(params);
      setCustomers(result.customers as Customer[]);
      setTotal(result.total);
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchCustomers({ search: value, page: 1, limit });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchCustomers({ search, page: newPage, limit });
  };

  const handleLimitChange = (newLimit: string) => {
    const l = parseInt(newLimit);
    setLimit(l);
    setPage(1);
    fetchCustomers({ search, page: 1, limit: l });
  };

  const handleDataChange = () => {
    fetchCustomers({ search, page, limit });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} username={user.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Customers"
          subtitle="Manage your customer database"
          username={user.username}
          avatar={user.avatar}
          role={user.role}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              title="Total Customers"
              value={stats.total}
              icon={Users}
              color="blue"
              delay={0}
            />
            <StatsCard
              title="VIP Customers"
              value={stats.vip}
              icon={Crown}
              color="amber"
              delay={0.1}
            />
            <StatsCard
              title="Regular Customers"
              value={stats.regular}
              icon={Users}
              color="emerald"
              delay={0.2}
            />
          </div>

          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by name or phone..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                className="gap-2"
                onClick={() => setCreateOpen(true)}
              >
                <UserPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Create Customer</span>
              </Button>
            </div>

            {/* Table */}
            <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
              <CustomerTable customers={customers} canDelete={canDelete} onDataChange={handleDataChange} />
            </div>

            {/* Pagination */}
            {total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Show</span>
                  <Select
                    value={String(limit)}
                    onValueChange={handleLimitChange}
                  >
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                  <span>
                    of {total} customer{total !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[80px] text-center">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    disabled={page >= totalPages}
                    onClick={() => handlePageChange(page + 1)}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Create dialog */}
      <CustomerFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={handleDataChange}
      />
    </div>
  );
}
