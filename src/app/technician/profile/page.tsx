import { requireRole } from "@/lib/auth";
import { TechnicianProfileClient } from "./client";

export default async function TechnicianProfilePage() {
  const user = await requireRole("TECHNICIAN");

  return (
    <TechnicianProfileClient
      user={JSON.parse(JSON.stringify({
        username: user.username,
        email: user.email,
        password: user.password,
        phone: user.phone,
        address: user.address,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      }))}
    />
  );
}
