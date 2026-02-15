import { requireAdmin } from "@/lib/auth";
import { AdminProfileClient } from "./client";

export default async function AdminProfilePage() {
  const user = await requireAdmin();

  return (
    <AdminProfileClient
      user={JSON.parse(JSON.stringify({
        username: user.username,
        email: user.email,
        password: user.password,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      }))}
    />
  );
}
