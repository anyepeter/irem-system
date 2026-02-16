"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { StatsCard } from "@/components/dashboard/stats-card";
import { ProductTable } from "./product-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getProducts } from "@/actions/inventory";
import { formatPrice } from "@/lib/inventory-constants";
import { cn } from "@/lib/utils";
import {
  Search,
  Plus,
  Package,
  AlertTriangle,
  XCircle,
  DollarSign,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  ArrowLeftRight,
  FolderTree,
  Bell,
} from "lucide-react";

type Product = {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
  purchasePrice: unknown;
  sellingPrice: unknown;
  profitMargin: unknown;
  condition: string;
  status: string;
  image: string | null;
  category: { id: string; name: string };
  createdBy: { username: string };
};

type Category = { id: string; name: string };

type Props = {
  user: {
    username: string;
    avatar: string | null;
    role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  };
  initialProducts: Product[];
  initialTotal: number;
  categories: Category[];
  stats: {
    totalProducts: number;
    lowStockCount: number;
    outOfStockCount: number;
    totalValue: number;
    totalCategories: number;
  };
  basePath: string;
};

export function InventoryListClient({ user, initialProducts, initialTotal, categories, stats, basePath }: Props) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [total, setTotal] = useState(initialTotal);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [isPending, startTransition] = useTransition();
  const limit = 10;
  const totalPages = Math.ceil(total / limit);

  const fetchProducts = (params: { search?: string; category?: string; status?: string; page?: number }) => {
    startTransition(async () => {
      const result = await getProducts({
        search: params.search || undefined,
        category: params.category === "all" ? undefined : params.category,
        status: params.status === "all" ? undefined : params.status,
        page: params.page || 1,
        limit,
      });
      setProducts(result.products as unknown as Product[]);
      setTotal(result.total);
    });
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
    fetchProducts({ search: value, category: categoryFilter, status: statusFilter, page: 1 });
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    setPage(1);
    fetchProducts({ search, category: value, status: statusFilter, page: 1 });
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setPage(1);
    fetchProducts({ search, category: categoryFilter, status: value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchProducts({ search, category: categoryFilter, status: statusFilter, page: newPage });
  };

  const handleDataChange = () => {
    fetchProducts({ search, category: categoryFilter, status: statusFilter, page });
    router.refresh();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} username={user.username} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="Inventory"
          subtitle="Manage products and stock"
          username={user.username}
          avatar={user.avatar}
          role={user.role}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatsCard title="Total Products" value={stats.totalProducts} icon={Package} color="blue" delay={0} />
            <StatsCard title="Low Stock" value={stats.lowStockCount} icon={AlertTriangle} color="amber" delay={0.1} />
            <StatsCard title="Out of Stock" value={stats.outOfStockCount} icon={XCircle} color="purple" delay={0.2} />
            <StatsCard title="Inventory Value" value={formatPrice(stats.totalValue)} icon={DollarSign} color="emerald" delay={0.3} />
            <StatsCard title="Categories" value={stats.totalCategories} icon={FolderOpen} color="blue" delay={0.4} />
          </div>

          {/* Sub-navigation */}
          {(user.role === "ADMIN" || user.role === "CASHIER") && (
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <Link href={basePath}>
                <Button variant="ghost" size="sm" className={cn("text-sm", "bg-blue-50 text-blue-700")}>
                  <Package className="w-4 h-4 mr-1.5" /> Products
                </Button>
              </Link>
              <Link href={`${basePath}/categories`}>
                <Button variant="ghost" size="sm" className="text-sm text-gray-600">
                  <FolderTree className="w-4 h-4 mr-1.5" /> Categories
                </Button>
              </Link>
              <Link href={`${basePath}/movements`}>
                <Button variant="ghost" size="sm" className="text-sm text-gray-600">
                  <ArrowLeftRight className="w-4 h-4 mr-1.5" /> Movements
                </Button>
              </Link>
              <Link href={`${basePath}/alerts`}>
                <Button variant="ghost" size="sm" className="text-sm text-gray-600">
                  <Bell className="w-4 h-4 mr-1.5" /> Alerts
                  {stats.lowStockCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold">
                      {stats.lowStockCount}
                    </span>
                  )}
                </Button>
              </Link>
            </div>
          )}

          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={handleStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="OUT_OF_STOCK">Out of Stock</SelectItem>
                <SelectItem value="DISCONTINUED">Discontinued</SelectItem>
              </SelectContent>
            </Select>
            {(user.role === "ADMIN" || user.role === "CASHIER") && (
              <Link href={`${basePath}/products/new`}>
                <Button className="w-full sm:w-auto">
                  <Plus className="w-4 h-4 mr-1" /> Add Product
                </Button>
              </Link>
            )}
          </div>

          {/* Product Table */}
          <ProductTable
            products={products}
            role={user.role}
            basePath={basePath}
            onDataChange={handleDataChange}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Showing {(page - 1) * limit + 1}-{Math.min(page * limit, total)} of {total}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => handlePageChange(page - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={page >= totalPages || isPending} onClick={() => handlePageChange(page + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
