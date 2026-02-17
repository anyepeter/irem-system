import { requireAdmin } from "@/lib/auth";
import { getSaleById } from "@/actions/sale";
import { SaleDetailClient } from "@/components/sales/sale-detail-client";
import { notFound } from "next/navigation";

export default async function AdminSaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  const sale = await getSaleById(id);

  if (!sale) notFound();

  return (
    <SaleDetailClient
      user={{
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      sale={JSON.parse(JSON.stringify(sale))}
      basePath="/admin"
    />
  );
}
