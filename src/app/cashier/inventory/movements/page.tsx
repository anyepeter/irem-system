import { requireRole } from "@/lib/auth";
import { getStockMovements } from "@/actions/inventory";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MovementsPageClient } from "@/components/inventory/movements-page-client";

export default async function CashierMovementsPage() {
  const cashier = await requireRole("CASHIER");
  const { movements, total } = await getStockMovements({ page: 1, limit: 20 });

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={cashier.role} username={cashier.username} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Stock Movements"
          subtitle="Track all inventory movements"
          username={cashier.username}
          avatar={cashier.avatar}
          role={cashier.role}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <MovementsPageClient
            initialMovements={JSON.parse(JSON.stringify(movements))}
            initialTotal={total}
          />
        </main>
      </div>
    </div>
  );
}
