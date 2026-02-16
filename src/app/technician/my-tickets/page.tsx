import { requireRole } from "@/lib/auth";
import { getTickets, getTicketStats } from "@/actions/ticket";
import { TicketListClient } from "@/components/tickets/ticket-list-client";

export default async function TechnicianMyTicketsPage() {
  const tech = await requireRole("TECHNICIAN");
  const [{ tickets, total }, stats] = await Promise.all([
    getTickets({ page: 1, limit: 20 }),
    getTicketStats(),
  ]);

  return (
    <TicketListClient
      user={{
        username: tech.username,
        avatar: tech.avatar,
        role: tech.role,
      }}
      initialTickets={JSON.parse(JSON.stringify(tickets))}
      initialTotal={total}
      stats={stats || { total: 0, pending: 0, inProgress: 0, completedToday: 0, completedThisWeek: 0, revenueThisMonth: 0 }}
      basePath="/technician/my-tickets"
      createPath=""
    />
  );
}
