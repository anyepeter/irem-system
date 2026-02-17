import { requireAdmin } from "@/lib/auth";
import { getTodaySales, getSalesStats } from "@/actions/sale";
import { SalesListClient } from "@/components/sales/sales-list-client";

export default async function AdminSalesPage() {
  const admin = await requireAdmin();
  const [{ sales, total }, stats] = await Promise.all([
    getTodaySales({ page: 1, limit: 20 }),
    getSalesStats(),
  ]);

  return (
    <SalesListClient
      user={{
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      initialSales={JSON.parse(JSON.stringify(sales))}
      initialTotal={total}
      stats={stats ? JSON.parse(JSON.stringify(stats)) : null}
      basePath="/admin"
    />
  );
}
