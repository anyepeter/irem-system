"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StockAdjustmentModal } from "./stock-adjustment-modal";
import { MovementHistory } from "./movement-history";
import { cn } from "@/lib/utils";
import { formatPrice, CONDITION_COLORS, STATUS_COLORS, MOVEMENT_COLORS } from "@/lib/inventory-constants";
import {
  Package,
  Edit2,
  ArrowLeft,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  RotateCcw,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

type Movement = {
  id: string;
  type: string;
  quantity: number;
  reason: string;
  notes: string | null;
  reference: string | null;
  createdAt: Date | string;
  product: { name: string; sku: string };
  createdBy: { username: string };
};

type Product = {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  quantity: number;
  reorderLevel: number;
  unit: string;
  purchasePrice: unknown;
  sellingPrice: unknown;
  profitMargin: unknown;
  condition: string;
  status: string;
  image: string | null;
  supplier: string | null;
  lastRestockedAt: string | null;
  createdAt: string;
  category: { id: string; name: string };
  createdBy: { username: string };
  stockMovements: Movement[];
  lowStockAlerts: { id: string; isActive: boolean }[];
};

type Props = {
  product: Product;
  user: {
    id: string;
    username: string;
    avatar: string | null;
    role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  };
  backPath: string;
  basePath: string;
};

export function ProductDetailClient({ product, user, backPath, basePath }: Props) {
  const router = useRouter();
  const [showAdjustment, setShowAdjustment] = useState(false);

  const condColor = CONDITION_COLORS[product.condition] || { bg: "bg-gray-50", text: "text-gray-700" };
  const statColor = STATUS_COLORS[product.status] || { bg: "bg-gray-50", text: "text-gray-700" };
  const isLowStock = product.quantity <= product.reorderLevel && product.quantity > 0;
  const canManage = user.role === "ADMIN" || user.role === "CASHIER";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} username={user.username} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={product.name}
          subtitle={`SKU: ${product.sku}`}
          username={user.username}
          avatar={user.avatar}
          role={user.role}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => router.push(backPath)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Products
            </Button>
            <div className="flex items-center gap-2">
              {canManage && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setShowAdjustment(true)}>
                    <RefreshCw className="w-4 h-4 mr-1" /> Adjust Stock
                  </Button>
                  <Link href={`${basePath}/products/${product.id}/edit`}>
                    <Button size="sm">
                      <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* Low stock warning */}
          {(isLowStock || product.quantity === 0) && (
            <div className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl",
              product.quantity === 0 ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
            )}>
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <p className="text-sm font-medium">
                {product.quantity === 0 ? "This product is out of stock!" : `Low stock! Only ${product.quantity} ${product.unit} remaining (reorder level: ${product.reorderLevel})`}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Info */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="w-5 h-5 text-blue-500" /> Product Details
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Name</p>
                      <p className="font-medium text-gray-900">{product.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">SKU</p>
                      <p className="font-medium text-gray-900 font-mono">{product.sku}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Category</p>
                      <p className="font-medium text-gray-900">{product.category.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Condition</p>
                      <Badge className={cn(condColor.bg, condColor.text)}>{product.condition}</Badge>
                    </div>
                    <div>
                      <p className="text-gray-500">Status</p>
                      <Badge className={cn(statColor.bg, statColor.text)}>{product.status.replace("_", " ")}</Badge>
                    </div>
                    <div>
                      <p className="text-gray-500">Supplier</p>
                      <p className="font-medium text-gray-900">{product.supplier || "—"}</p>
                    </div>
                    {product.description && (
                      <div className="col-span-2">
                        <p className="text-gray-500">Description</p>
                        <p className="text-gray-900">{product.description}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-500" /> Stock & Pricing
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-gray-500 text-xs">Current Stock</p>
                      <p className={cn("text-2xl font-bold mt-1", isLowStock ? "text-amber-600" : product.quantity === 0 ? "text-red-600" : "text-gray-900")}>
                        {product.quantity}
                      </p>
                      <p className="text-xs text-gray-400">{product.unit}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-gray-500 text-xs">Reorder Level</p>
                      <p className="text-2xl font-bold mt-1 text-gray-900">{product.reorderLevel}</p>
                      <p className="text-xs text-gray-400">{product.unit}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-gray-500 text-xs">Profit Margin</p>
                      <p className="text-2xl font-bold mt-1 text-emerald-600">{Number(product.profitMargin).toFixed(1)}%</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-gray-500 text-xs">Purchase Price</p>
                      <p className="text-lg font-bold mt-1 text-gray-900">{formatPrice(product.purchasePrice as string)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-gray-500 text-xs">Selling Price</p>
                      <p className="text-lg font-bold mt-1 text-blue-600">{formatPrice(product.sellingPrice as string)}</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center">
                      <p className="text-gray-500 text-xs">Stock Value</p>
                      <p className="text-lg font-bold mt-1 text-gray-900">{formatPrice(product.quantity * Number(product.purchasePrice))}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Movement History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Stock Movements</CardTitle>
                </CardHeader>
                <CardContent>
                  <MovementHistory movements={product.stockMovements.map((m) => ({ ...m, product: { name: product.name, sku: product.sku } }))} />
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {product.image ? (
                <Card className="overflow-hidden">
                  <img src={product.image} alt={product.name} className="w-full h-64 object-cover" />
                </Card>
              ) : (
                <Card className="p-8 flex flex-col items-center justify-center">
                  <Package className="w-16 h-16 text-gray-200 mb-2" />
                  <p className="text-sm text-gray-400">No image</p>
                </Card>
              )}

              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created by</span>
                      <span className="font-medium">{product.createdBy.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Created</span>
                      <span className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</span>
                    </div>
                    {product.lastRestockedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Last Restocked</span>
                        <span className="font-medium">{new Date(product.lastRestockedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>

      <StockAdjustmentModal
        open={showAdjustment}
        onClose={() => setShowAdjustment(false)}
        productId={product.id}
        productName={product.name}
        currentStock={product.quantity}
        unit={product.unit}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
