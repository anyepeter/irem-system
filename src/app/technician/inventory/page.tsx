import { requireRole } from "@/lib/auth";
import { getProducts, getCategories, getInventoryStats } from "@/actions/inventory";
import { InventoryListClient } from "@/components/inventory/inventory-list-client";

export default async function TechnicianInventoryPage() {
  const tech = await requireRole("TECHNICIAN");
  const [{ products, total }, categories, stats] = await Promise.all([
    getProducts({ page: 1, limit: 10 }),
    getCategories(),
    getInventoryStats(),
  ]);

  return (
    <InventoryListClient
      user={{
        username: tech.username,
        avatar: tech.avatar,
        role: tech.role,
      }}
      initialProducts={JSON.parse(JSON.stringify(products))}
      initialTotal={total}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
      stats={stats}
      basePath="/technician/inventory"
    />
  );
}
