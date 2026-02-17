import { requireRole } from "@/lib/auth";
import { getTodaySales, getSalesStats } from "@/actions/sale";
import { SalesListClient } from "@/components/sales/sales-list-client";

export default async function CashierSalesPage() {
  const cashier = await requireRole("CASHIER");
  const [{ sales, total }, stats] = await Promise.all([
    getTodaySales({ page: 1, limit: 20 }),
    getSalesStats(),
  ]);

  return (
    <SalesListClient
      user={{
        username: cashier.username,
        avatar: cashier.avatar,
        role: cashier.role,
      }}
      initialSales={JSON.parse(JSON.stringify(sales))}
      initialTotal={total}
      stats={stats ? JSON.parse(JSON.stringify(stats)) : null}
      basePath="/cashier"
    />
  );
}
