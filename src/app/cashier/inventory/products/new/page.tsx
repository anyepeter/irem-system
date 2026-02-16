import { requireRole } from "@/lib/auth";
import { getCategories } from "@/actions/inventory";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { ProductForm } from "@/components/inventory/product-form";

export default async function CashierNewProductPage() {
  const cashier = await requireRole("CASHIER");
  const categories = await getCategories();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={cashier.role} username={cashier.username} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Add Product"
          subtitle="Add a new product to inventory"
          username={cashier.username}
          avatar={cashier.avatar}
          role={cashier.role}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <ProductForm
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
            backPath="/cashier/inventory"
          />
        </main>
      </div>
    </div>
  );
}
