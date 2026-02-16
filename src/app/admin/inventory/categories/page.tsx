import { requireAdmin } from "@/lib/auth";
import { getCategories } from "@/actions/inventory";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { CategoryPageClient } from "@/components/inventory/category-page-client";

export default async function AdminCategoriesPage() {
  const admin = await requireAdmin();
  const categories = await getCategories();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={admin.role} username={admin.username} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Categories"
          subtitle="Manage product categories"
          username={admin.username}
          avatar={admin.avatar}
          role={admin.role}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <CategoryPageClient
            initialCategories={JSON.parse(JSON.stringify(categories))}
            role={admin.role}
          />
        </main>
      </div>
    </div>
  );
}
