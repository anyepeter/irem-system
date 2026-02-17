import { requireRole } from "@/lib/auth";
import { getSales } from "@/actions/sale";
import { SalesHistoryClient } from "@/components/sales/sales-history-client";

export default async function CashierSalesHistoryPage() {
  const cashier = await requireRole("CASHIER");
  const { sales, total } = await getSales({ page: 1, limit: 20 });

  return (
    <SalesHistoryClient
      user={{
        username: cashier.username,
        avatar: cashier.avatar,
        role: cashier.role,
      }}
      initialSales={JSON.parse(JSON.stringify(sales))}
      initialTotal={total}
      basePath="/cashier"
    />
  );
}
