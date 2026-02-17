import { requireAdmin } from "@/lib/auth";
import { getSalesReport } from "@/actions/sale";
import { SalesReportClient } from "@/components/sales/sales-report-client";

export default async function AdminSalesReportsPage() {
  const admin = await requireAdmin();
  const report = await getSalesReport();

  return (
    <SalesReportClient
      user={{
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      initialReport={report ? JSON.parse(JSON.stringify(report)) : null}
      basePath="/admin"
    />
  );
}
