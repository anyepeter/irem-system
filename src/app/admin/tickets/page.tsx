import { requireAdmin } from "@/lib/auth";
import { getTickets, getTicketStats } from "@/actions/ticket";
import { TicketListClient } from "@/components/tickets/ticket-list-client";

export default async function AdminTicketsPage() {
  const admin = await requireAdmin();
  const [{ tickets, total }, stats] = await Promise.all([
    getTickets({ page: 1, limit: 20 }),
    getTicketStats(),
  ]);

  return (
    <TicketListClient
      user={{
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      initialTickets={JSON.parse(JSON.stringify(tickets))}
      initialTotal={total}
      stats={stats || { total: 0, pending: 0, inProgress: 0, completedToday: 0, completedThisWeek: 0, revenueThisMonth: 0 }}
      basePath="/admin/tickets"
      createPath="/admin/tickets/create"
    />
  );
}
