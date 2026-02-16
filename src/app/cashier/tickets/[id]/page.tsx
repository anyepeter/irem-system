import { requireRole } from "@/lib/auth";
import { getTicketById } from "@/actions/ticket";
import { TicketDetailClient } from "@/components/tickets/ticket-detail-client";
import { notFound } from "next/navigation";

export default async function CashierTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cashier = await requireRole("CASHIER");
  const ticket = await getTicketById(id);

  if (!ticket) notFound();

  return (
    <TicketDetailClient
      ticket={JSON.parse(JSON.stringify(ticket))}
      user={{
        id: cashier.id,
        username: cashier.username,
        avatar: cashier.avatar,
        role: cashier.role,
      }}
      backPath="/cashier/tickets"
    />
  );
}
