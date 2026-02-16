import { requireAdmin } from "@/lib/auth";
import { getCustomers, getCustomerStats } from "@/actions/customer";
import { CustomerPageClient } from "@/components/customers/customer-page-client";

export default async function AdminCustomersPage() {
  const admin = await requireAdmin();
  const [{ customers, total }, stats] = await Promise.all([
    getCustomers({ page: 1, limit: 10 }),
    getCustomerStats(),
  ]);

  return (
    <CustomerPageClient
      user={{
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      initialCustomers={JSON.parse(JSON.stringify(customers))}
      initialTotal={total}
      stats={stats}
    />
  );
}
