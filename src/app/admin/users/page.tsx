import { requireAdmin } from "@/lib/auth";
import { getUsers, getUserStats } from "@/actions/user";
import { AdminUsersClient } from "./client";

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const [users, stats] = await Promise.all([getUsers(), getUserStats()]);

  return (
    <AdminUsersClient
      admin={{
        id: admin.id,
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      initialUsers={JSON.parse(JSON.stringify(users))}
      stats={stats}
    />
  );
}
