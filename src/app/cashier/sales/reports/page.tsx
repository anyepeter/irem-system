import { requireRole } from "@/lib/auth";
import { getSalesReport } from "@/actions/sale";
import { SalesReportClient } from "@/components/sales/sales-report-client";

export default async function CashierSalesReportsPage() {
  const cashier = await requireRole("CASHIER");
  const report = await getSalesReport();

  return (
    <SalesReportClient
      user={{
        username: cashier.username,
        avatar: cashier.avatar,
        role: cashier.role,
      }}
      initialReport={report ? JSON.parse(JSON.stringify(report)) : null}
      basePath="/cashier"
    />
  );
}
