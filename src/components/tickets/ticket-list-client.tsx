"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { TicketTable } from "./ticket-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTickets } from "@/actions/ticket";
import { STATUS_LABELS } from "@/lib/ticket-constants";
import {
  Search,
  Plus,
  ClipboardList,
  Clock,
  Wrench,
  CheckCircle,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type TicketRow = {
  id: string;
  ticketNumber: string;
  status: string;
  priority: string;
  deviceType: string;
  brand: string;
  totalAmount: unknown;
  createdAt: Date | string;
  customer: { id: number; name: string; phone: string; isVIP: boolean };
  assignedTo: { id: string; username: string };
  createdBy: { username: string };
};

type Props = {
  user: {
    username: string;
    avatar: string | null;
    role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  };
  initialTickets: TicketRow[];
  initialTotal: number;
  stats: {
    total: number;
    pending: number;
    inProgress: number;
    completedToday: number;
    completedThisWeek: number;
    revenueThisMonth: number;
  };
  basePath: string;
  createPath: string;
};

export function TicketListClient({
  user,
  initialTickets,
  initialTotal,
  stats,
  basePath,
  createPath,
}: Props) {
  const canDelete = user.role === "ADMIN";
  const isTechnician = user.role === "TECHNICIAN";

  const [tickets, setTickets] = useState(initialTickets);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [isPending, startTransition] = useTransition();

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const fetchTickets = (params: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    startTransition(async () => {
      const result = await getTickets(params);
      setTickets(result.tickets as unknown as TicketRow[]);
      setTotal(result.total);
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchTickets({ search: value, status: statusFilter, page: 1, limit });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    fetchTickets({ search, status: value, page: 1, limit });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchTickets({ search, status: statusFilter, page: newPage, limit });
  };

  const handleDataChange = () => {
    fetchTickets({ search, status: statusFilter, page, limit });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} username={user.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={isTechnician ? "My Tickets" : "Tickets"}
          subtitle={
            isTechnician
              ? "View your assigned repair tickets"
              : "Manage repair tickets"
          }
          username={user.username}
          avatar={user.avatar}
          role={user.role}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatsCard
              title={isTechnician ? "My Tickets" : "Total Tickets"}
              value={stats.total}
              icon={ClipboardList}
              color="blue"
              delay={0}
            />
            <StatsCard
              title="Pending"
              value={stats.pending}
              icon={Clock}
              color="amber"
              delay={0.1}
            />
            <StatsCard
              title="In Progress"
              value={stats.inProgress}
              icon={Wrench}
              color="purple"
              delay={0.2}
            />
            <StatsCard
              title={isTechnician ? "Completed (Week)" : "Completed Today"}
              value={isTechnician ? stats.completedThisWeek : stats.completedToday}
              icon={CheckCircle}
              color="emerald"
              delay={0.3}
            />
            {!isTechnician && (
              <StatsCard
                title="Revenue (Month)"
                value={stats.revenueThisMonth}
                icon={DollarSign}
                color="blue"
                delay={0.4}
              />
            )}
          </div>

          {/* Toolbar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search tickets..."
                    value={search}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={handleStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {!isTechnician && (
                <Link href={createPath}>
                  <Button className="gap-2">
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Create Ticket</span>
                  </Button>
                </Link>
              )}
            </div>

            {/* Table */}
            <div className={isPending ? "opacity-60 pointer-events-none" : ""}>
              <TicketTable
                tickets={tickets}
                canDelete={canDelete}
                basePath={basePath}
                onDataChange={handleDataChange}
              />
            </div>

            {/* Pagination */}
            {total > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>
                    Showing {Math.min((page - 1) * limit + 1, total)}-
                    {Math.min(page * limit, total)} of {total} ticket
                    {total !== 1 ? "s" : ""}
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
    </div>
  );
}
