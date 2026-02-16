import { requireAdmin } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { CreateTicketForm } from "@/components/tickets/create-ticket-form";

export default async function AdminCreateTicketPage() {
  const admin = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={admin.role} username={admin.username} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Create Ticket"
          subtitle="Create a new repair ticket"
          username={admin.username}
          avatar={admin.avatar}
          role={admin.role}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <CreateTicketForm basePath="/admin/tickets" />
        </main>
      </div>
    </div>
  );
}
