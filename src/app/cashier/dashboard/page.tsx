import { requireRole } from "@/lib/auth";
import {
  getCashierTodayStats,
  getCashierMonthStats,
  getCashierHourlySales,
  getCashierWeeklySales,
  getCashierPaymentBreakdown,
  getCashierRecentSales,
  getPendingDiagnosticFees,
  getStockAlerts,
  getOutstandingCredit,
} from "@/actions/dashboard";
import { CashierDashboardClient } from "./client";

export default async function CashierDashboardPage() {
  const user = await requireRole("CASHIER");

  const [
    todayStats,
    monthStats,
    hourlySales,
    weeklySales,
    paymentBreakdown,
    recentSales,
    pendingFees,
    stockAlerts,
    creditSales,
  ] = await Promise.all([
    getCashierTodayStats(),
    getCashierMonthStats(),
    getCashierHourlySales(),
    getCashierWeeklySales(),
    getCashierPaymentBreakdown(),
    getCashierRecentSales(5),
    getPendingDiagnosticFees(5),
    getStockAlerts(5),
    getOutstandingCredit(5),
  ]);

  return (
    <CashierDashboardClient
      user={{
        username: user.username,
        avatar: user.avatar,
        role: user.role,
      }}
      todayStats={todayStats}
      monthStats={monthStats}
      hourlySales={hourlySales}
      weeklySales={weeklySales}
      paymentBreakdown={paymentBreakdown}
      recentSales={recentSales}
      pendingFees={pendingFees}
      stockAlerts={stockAlerts}
      creditSales={creditSales}
    />
  );
}
