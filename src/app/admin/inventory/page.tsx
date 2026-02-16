import { requireAdmin } from "@/lib/auth";
import { getProducts, getCategories, getInventoryStats } from "@/actions/inventory";
import { InventoryListClient } from "@/components/inventory/inventory-list-client";

export default async function AdminInventoryPage() {
  const admin = await requireAdmin();
  const [{ products, total }, categories, stats] = await Promise.all([
    getProducts({ page: 1, limit: 10 }),
    getCategories(),
    getInventoryStats(),
  ]);

  return (
    <InventoryListClient
      user={{
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      initialProducts={JSON.parse(JSON.stringify(products))}
      initialTotal={total}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      stats={stats}
      basePath="/admin/inventory"
    />
  );
}
