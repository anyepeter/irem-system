import { requireRole } from "@/lib/auth";
import { CashierDashboardClient } from "./client";

export default async function CashierDashboardPage() {
  const user = await requireRole("CASHIER");

  return (
    <CashierDashboardClient
      user={{
        username: user.username,
        avatar: user.avatar,
        role: user.role,
      }}
    />
  );
}
