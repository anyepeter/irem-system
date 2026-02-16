import { requireRole } from "@/lib/auth";
import { getCategories } from "@/actions/inventory";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { CategoryPageClient } from "@/components/inventory/category-page-client";

export default async function CashierCategoriesPage() {
  const cashier = await requireRole("CASHIER");
  const categories = await getCategories();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={cashier.role} username={cashier.username} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Categories"
          subtitle="Manage product categories"
          username={cashier.username}
          avatar={cashier.avatar}
          role={cashier.role}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <CategoryPageClient
            initialCategories={JSON.parse(JSON.stringify(categories))}
            role={cashier.role}
          />
        </main>
      </div>
    </div>
  );
}
