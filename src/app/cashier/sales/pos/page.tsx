import { requireRole } from "@/lib/auth";
import { getProductsForPOS } from "@/actions/sale";
import { db } from "@/lib/db";
import { POSClient } from "@/components/sales/pos-client";

export default async function CashierPOSPage() {
  const cashier = await requireRole("CASHIER");
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
        username: cashier.username,
        avatar: cashier.avatar,
        role: cashier.role,
      }}
      initialProducts={JSON.parse(JSON.stringify(products))}
      customers={customers}
      categories={categories}
      basePath="/cashier"
    />
  );
}
