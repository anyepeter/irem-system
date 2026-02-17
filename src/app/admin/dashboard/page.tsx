import { requireAdmin } from "@/lib/auth";
import {
  getAdminFinancialStats,
  getAdminTodayStats,
  getAdminSystemCounts,
  getRevenueChartData,
  getDailySalesChartData,
  getTicketStatusChartData,
  getPaymentMethodChartData,
  getStockAlerts,
  getRecentActivity,
  getTopSellingProducts,
  getTopTechnicians,
  getOutstandingCredit,
} from "@/actions/dashboard";
import { AdminDashboardClient } from "./client";

export default async function AdminDashboardPage() {
  const admin = await requireAdmin();

  const [
    financial,
    todayStats,
    systemCounts,
    revenueChart,
    dailySalesChart,
    ticketStatusChart,
    paymentMethodChart,
    stockAlerts,
    recentActivity,
    topProducts,
    topTechnicians,
    creditData,
  ] = await Promise.all([
    getAdminFinancialStats(),
    getAdminTodayStats(),
    getAdminSystemCounts(),
    getRevenueChartData(6),
    getDailySalesChartData(7),
    getTicketStatusChartData(),
    getPaymentMethodChartData(),
    getStockAlerts(8),
    getRecentActivity(8),
    getTopSellingProducts(5),
    getTopTechnicians(5),
    getOutstandingCredit(5),
  ]);

  return (
    <AdminDashboardClient
      admin={{
        id: admin.id,
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      financial={financial}
      todayStats={todayStats}
      systemCounts={systemCounts}
      revenueChart={revenueChart}
      dailySalesChart={dailySalesChart}
      ticketStatusChart={ticketStatusChart}
      paymentMethodChart={paymentMethodChart}
      stockAlerts={stockAlerts}
      recentActivity={recentActivity}
      topProducts={topProducts}
      topTechnicians={topTechnicians}
      creditData={creditData}
    />
  );
}
