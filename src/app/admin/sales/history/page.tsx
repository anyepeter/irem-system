import { requireAdmin } from "@/lib/auth";
import { getSales } from "@/actions/sale";
import { SalesHistoryClient } from "@/components/sales/sales-history-client";

export default async function AdminSalesHistoryPage() {
  const admin = await requireAdmin();
  const { sales, total } = await getSales({ page: 1, limit: 20 });

  return (
    <SalesHistoryClient
      user={{
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      initialSales={JSON.parse(JSON.stringify(sales))}
      initialTotal={total}
      basePath="/admin"
    />
  );
}
