import { requireRole } from "@/lib/auth";
import { getTicketById } from "@/actions/ticket";
import { TicketDetailClient } from "@/components/tickets/ticket-detail-client";
import { notFound } from "next/navigation";

export default async function TechnicianTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tech = await requireRole("TECHNICIAN");
  const ticket = await getTicketById(id);

  if (!ticket) notFound();

  return (
    <TicketDetailClient
      ticket={JSON.parse(JSON.stringify(ticket))}
      user={{
        id: tech.id,
        username: tech.username,
        avatar: tech.avatar,
        role: tech.role,
      }}
      backPath="/technician/my-tickets"
    />
  );
}
