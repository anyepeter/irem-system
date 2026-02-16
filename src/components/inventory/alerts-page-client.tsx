"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StockAdjustmentModal } from "./stock-adjustment-modal";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  XCircle,
  Package,
  RefreshCw,
  Eye,
} from "lucide-react";

type LowStockProduct = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
  status: string;
  category: { name: string };
};

type Props = {
  initialProducts: LowStockProduct[];
  role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  basePath: string;
};

export function AlertsPageClient({ initialProducts, role, basePath }: Props) {
  const router = useRouter();
  const [restockProduct, setRestockProduct] = useState<LowStockProduct | null>(null);

  const outOfStock = initialProducts.filter((p) => p.quantity === 0);
  const lowStock = initialProducts.filter((p) => p.quantity > 0);
  const canManage = role === "ADMIN" || role === "CASHIER";

  if (initialProducts.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-lg font-medium text-gray-500">All stock levels are healthy</p>
        <p className="text-sm text-gray-400 mt-1">No products are below their reorder level</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
            <XCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{outOfStock.length}</p>
            <p className="text-xs text-gray-500">Out of Stock</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{lowStock.length}</p>
            <p className="text-xs text-gray-500">Low Stock</p>
          </div>
        </Card>
      </div>

      {/* Out of Stock */}
      {outOfStock.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-red-700 mb-3 flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Out of Stock ({outOfStock.length})
          </h3>
          <div className="space-y-2">
            {outOfStock.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-4 border-red-100 bg-red-50/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        SKU: {product.sku} | {product.category.name} | Min: {product.reorderLevel} {product.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-red-100 text-red-700">0 {product.unit}</Badge>
                      {canManage && (
                        <Button size="sm" variant="outline" onClick={() => setRestockProduct(product)}>
                          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Restock
                        </Button>
                      )}
                      <Link href={`${basePath}/products/${product.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Low Stock */}
      {lowStock.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-amber-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Low Stock ({lowStock.length})
          </h3>
          <div className="space-y-2">
            {lowStock.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-4 border-amber-100 bg-amber-50/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        SKU: {product.sku} | {product.category.name} | Min: {product.reorderLevel} {product.unit}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-amber-100 text-amber-700">
                        {product.quantity} {product.unit}
                      </Badge>
                      {canManage && (
                        <Button size="sm" variant="outline" onClick={() => setRestockProduct(product)}>
                          <RefreshCw className="w-3.5 h-3.5 mr-1" /> Restock
                        </Button>
                      )}
                      <Link href={`${basePath}/products/${product.id}`}>
                        <Button size="sm" variant="ghost">
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockProduct && (
        <StockAdjustmentModal
          open={!!restockProduct}
          onClose={() => setRestockProduct(null)}
          productId={restockProduct.id}
          productName={restockProduct.name}
          currentStock={restockProduct.quantity}
          unit={restockProduct.unit}
          onSuccess={() => {
            setRestockProduct(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
