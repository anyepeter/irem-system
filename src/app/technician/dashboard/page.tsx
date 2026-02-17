import { requireRole } from "@/lib/auth";
import { TechnicianDashboardClient } from "./client";
import {
  getTechnicianDashboardStats,
  getTechnicianUrgentTickets,
  getTechnicianPendingAction,
  getTechnicianInProgressTickets,
  getTechnicianRecentCompleted,
} from "@/actions/dashboard";

export default async function TechnicianDashboardPage() {
  const user = await requireRole("TECHNICIAN");

  const [stats, urgentTickets, pendingAction, inProgressTickets, recentCompleted] =
    await Promise.all([
      getTechnicianDashboardStats(user.id),
      getTechnicianUrgentTickets(user.id),
      getTechnicianPendingAction(user.id),
      getTechnicianInProgressTickets(user.id),
      getTechnicianRecentCompleted(user.id),
    ]);

  return (
    <TechnicianDashboardClient
      user={{
        username: user.username,
        avatar: user.avatar,
        role: user.role,
      }}
      stats={stats}
      urgentTickets={urgentTickets}
      pendingAction={pendingAction}
      inProgressTickets={inProgressTickets}
      recentCompleted={recentCompleted}
    />
  );
}
