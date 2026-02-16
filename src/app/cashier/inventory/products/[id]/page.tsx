import { requireRole } from "@/lib/auth";
import { getProductById } from "@/actions/inventory";
import { ProductDetailClient } from "@/components/inventory/product-detail-client";
import { notFound } from "next/navigation";

export default async function CashierProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cashier = await requireRole("CASHIER");
  const product = await getProductById(id);

  if (!product) notFound();

  return (
    <ProductDetailClient
      product={JSON.parse(JSON.stringify(product))}
      user={{
        id: cashier.id,
        username: cashier.username,
        avatar: cashier.avatar,
        role: cashier.role,
      }}
      backPath="/cashier/inventory"
      basePath="/cashier/inventory"
    />
  );
}
