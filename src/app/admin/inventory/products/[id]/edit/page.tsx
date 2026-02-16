import { requireAdmin } from "@/lib/auth";
import { getProductById, getCategories } from "@/actions/inventory";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { ProductForm } from "@/components/inventory/product-form";
import { notFound } from "next/navigation";

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await requireAdmin();
  const [product, categories] = await Promise.all([
    getProductById(id),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={admin.role} username={admin.username} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Edit Product"
          subtitle={`Editing: ${product.name}`}
          username={admin.username}
          avatar={admin.avatar}
          role={admin.role}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <ProductForm
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            product={JSON.parse(JSON.stringify(product))}
            backPath="/admin/inventory"
          />
        </main>
      </div>
    </div>
  );
}
