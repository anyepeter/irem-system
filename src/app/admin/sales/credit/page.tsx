import { requireAdmin } from "@/lib/auth";
import { getCreditSales } from "@/actions/sale";
import { CreditSalesClient } from "@/components/sales/credit-sales-client";

export default async function AdminCreditSalesPage() {
  const admin = await requireAdmin();
  const { sales, total } = await getCreditSales({ page: 1, limit: 20 });

  return (
    <CreditSalesClient
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
