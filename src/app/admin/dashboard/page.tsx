import { requireAdmin } from "@/lib/auth";
import { getUserStats } from "@/actions/user";
import { getCustomerStats } from "@/actions/customer";
import { AdminDashboardClient } from "./client";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const [stats, customerStats] = await Promise.all([
    getUserStats(),
    getCustomerStats(),
  ]);

  return (
    <AdminDashboardClient
      admin={{
        id: admin.id,
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      stats={stats}
      customerStats={customerStats}
    />
  );
}
