import { requireRole } from "@/lib/auth";
import { getSaleById } from "@/actions/sale";
import { SaleDetailClient } from "@/components/sales/sale-detail-client";
import { notFound } from "next/navigation";

export default async function CashierSaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cashier = await requireRole("CASHIER");
  const { id } = await params;
  const sale = await getSaleById(id);

  if (!sale) notFound();

  return (
    <SaleDetailClient
      user={{
        username: cashier.username,
        avatar: cashier.avatar,
        role: cashier.role,
      }}
      sale={JSON.parse(JSON.stringify(sale))}
      basePath="/cashier"
    />
  );
}
