import { requireAdmin } from "@/lib/auth";
import { getProductById } from "@/actions/inventory";
import { ProductDetailClient } from "@/components/inventory/product-detail-client";
import { notFound } from "next/navigation";

export default async function AdminProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await requireAdmin();
  const product = await getProductById(id);

  if (!product) notFound();

  return (
    <ProductDetailClient
      product={JSON.parse(JSON.stringify(product))}
      user={{
        id: admin.id,
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      backPath="/admin/inventory"
      basePath="/admin/inventory"
    />
  );
}
