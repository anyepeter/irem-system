import { requireAdmin } from "@/lib/auth";
import { getProductsForPOS } from "@/actions/sale";
import { db } from "@/lib/db";
import { POSClient } from "@/components/sales/pos-client";

export default async function AdminPOSPage() {
  const admin = await requireAdmin();
  const [products, customers, categories] = await Promise.all([
    getProductsForPOS(),
    db.customer.findMany({
      select: { id: true, name: true, phone: true, isVIP: true },
      orderBy: { name: "asc" },
    }),
    db.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <POSClient
      user={{
        username: admin.username,
        avatar: admin.avatar,
        role: admin.role,
      }}
      initialProducts={JSON.parse(JSON.stringify(products))}
      customers={customers}
      categories={categories}
      basePath="/admin"
    />
  );
}
