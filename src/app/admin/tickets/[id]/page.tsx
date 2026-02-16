import { requireAdmin } from "@/lib/auth";
import { getTicketById } from "@/actions/ticket";
import { TicketDetailClient } from "@/components/tickets/ticket-detail-client";
import { notFound } from "next/navigation";

export default async function AdminTicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await requireAdmin();
  const ticket = await getTicketById(id);

  if (!ticket) notFound();

  return (
    <TicketDetailClient
      ticket={JSON.parse(JSON.stringify(ticket))}
      user={{
        id: admin.id,
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      backPath="/admin/tickets"
    />
  );
}
