import { requireRole } from "@/lib/auth";
import { getCustomers, getCustomerStats } from "@/actions/customer";
import { CustomerPageClient } from "@/components/customers/customer-page-client";

export default async function CashierCustomersPage() {
  const cashier = await requireRole("CASHIER");
  const [{ customers, total }, stats] = await Promise.all([
    getCustomers({ page: 1, limit: 10 }),
    getCustomerStats(),
  ]);

  return (
    <CustomerPageClient
      user={{
        username: cashier.username,
        avatar: cashier.avatar,
        role: cashier.role,
      }}
      initialCustomers={JSON.parse(JSON.stringify(customers))}
      initialTotal={total}
      stats={stats}
    />
  );
}
