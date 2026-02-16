import { requireAdmin } from "@/lib/auth";
import { getLowStockProducts } from "@/actions/inventory";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { AlertsPageClient } from "@/components/inventory/alerts-page-client";

export default async function AdminAlertsPage() {
  const admin = await requireAdmin();
  const lowStockProducts = await getLowStockProducts();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={admin.role} username={admin.username} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Low Stock Alerts"
          subtitle="Products that need restocking"
          username={admin.username}
          avatar={admin.avatar}
          role={admin.role}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <AlertsPageClient
            initialProducts={JSON.parse(JSON.stringify(lowStockProducts))}
            role={admin.role}
            basePath="/admin/inventory"
          />
        </main>
      </div>
    </div>
  );
}
