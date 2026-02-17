import { requireRole } from "@/lib/auth";
import { getCreditSales } from "@/actions/sale";
import { CreditSalesClient } from "@/components/sales/credit-sales-client";

export default async function CashierCreditSalesPage() {
  const cashier = await requireRole("CASHIER");
  const { sales, total } = await getCreditSales({ page: 1, limit: 20 });

  return (
    <CreditSalesClient
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
