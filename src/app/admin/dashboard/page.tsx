import { requireAdmin } from "@/lib/auth";
import { getUserStats } from "@/actions/user";
import { getCustomerStats } from "@/actions/customer";
import { getTicketStats } from "@/actions/ticket";
import { AdminDashboardClient } from "./client";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const [stats, customerStats, ticketStats] = await Promise.all([
    getUserStats(),
    getCustomerStats(),
    getTicketStats(),
  ]);

  return (
    <AdminDashboardClient
      admin={{
        id: admin.id,
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      stats={stats}
      customerStats={customerStats}
      ticketStats={ticketStats || { total: 0, pending: 0, inProgress: 0, completedToday: 0, completedThisWeek: 0, revenueThisMonth: 0 }}
    />
  );
}
