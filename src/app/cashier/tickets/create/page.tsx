import { requireRole } from "@/lib/auth";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { CreateTicketForm } from "@/components/tickets/create-ticket-form";

export default async function CashierCreateTicketPage() {
  const cashier = await requireRole("CASHIER");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={cashier.role} username={cashier.username} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Create Ticket"
          subtitle="Create a new repair ticket"
          username={cashier.username}
          avatar={cashier.avatar}
          role={cashier.role}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <CreateTicketForm basePath="/cashier/tickets" />
        </main>
      </div>
    </div>
  );
}
