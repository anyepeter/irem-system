import { requireRole } from "@/lib/auth";
import { getProductById } from "@/actions/inventory";
import { ProductDetailClient } from "@/components/inventory/product-detail-client";
import { notFound } from "next/navigation";

export default async function TechnicianProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const tech = await requireRole("TECHNICIAN");
  const product = await getProductById(id);

  if (!product) notFound();

  return (
    <ProductDetailClient
      product={JSON.parse(JSON.stringify(product))}
      user={{
        id: tech.id,
        username: tech.username,
        avatar: tech.avatar,
        role: tech.role,
      }}
      backPath="/technician/inventory"
      basePath="/technician/inventory"
    />
  );
}
