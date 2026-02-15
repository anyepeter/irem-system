import { requireRole } from "@/lib/auth";
import { TechnicianDashboardClient } from "./client";

export default async function TechnicianDashboardPage() {
  const user = await requireRole("TECHNICIAN");

  return (
    <TechnicianDashboardClient
      user={{
        username: user.username,
        avatar: user.avatar,
        role: user.role,
      }}
    />
  );
}
