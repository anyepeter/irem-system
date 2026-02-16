import { requireRole } from "@/lib/auth";
import { getTickets, getTicketStats } from "@/actions/ticket";
import { TicketListClient } from "@/components/tickets/ticket-list-client";

export default async function CashierTicketsPage() {
  const cashier = await requireRole("CASHIER");
  const [{ tickets, total }, stats] = await Promise.all([
    getTickets({ page: 1, limit: 20 }),
    getTicketStats(),
  ]);

  return (
    <TicketListClient
      user={{
        username: cashier.username,
        avatar: cashier.avatar,
        role: cashier.role,
      }}
      initialTickets={JSON.parse(JSON.stringify(tickets))}
      initialTotal={total}
      stats={stats || { total: 0, pending: 0, inProgress: 0, completedToday: 0, completedThisWeek: 0, revenueThisMonth: 0 }}
      basePath="/cashier/tickets"
      createPath="/cashier/tickets/create"
    />
  );
}
