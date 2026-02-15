import { requireAdmin } from "@/lib/auth";
import { getUsers, getUserStats } from "@/actions/user";
import { AdminDashboardClient } from "./client";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();
  const [users, stats] = await Promise.all([getUsers(), getUserStats()]);

  return (
    <AdminDashboardClient
      admin={{
        id: admin.id,
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      users={JSON.parse(JSON.stringify(users))}
      stats={stats}
    />
  );
}
