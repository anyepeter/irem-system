import { requireRole } from "@/lib/auth";
import { CashierProfileClient } from "./client";

export default async function CashierProfilePage() {
  const user = await requireRole("CASHIER");

  return (
    <CashierProfileClient
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
