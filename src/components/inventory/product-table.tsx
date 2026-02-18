"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import {
  checkProductRelatedData,
  cascadeDeleteProduct,
  type DeleteCheckResult,
} from "@/actions/delete";
import { formatPrice } from "@/lib/inventory-constants";
import { CONDITION_COLORS, STATUS_COLORS } from "@/lib/inventory-constants";
import { Trash2, Eye, Package, AlertTriangle } from "lucide-react";

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

type Props = {
  products: Product[];
  role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  basePath: string;
  onDataChange?: () => void;
};

export function ProductTable({ products, role, basePath, onDataChange }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [checkResult, setCheckResult] = useState<DeleteCheckResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleDeleteClick = async (product: Product) => {
    setDeleteTarget(product);
    setCheckResult(null);
    setDeleteResult(null);
    setCheckLoading(true);
    const result = await checkProductRelatedData(product.id);
    setCheckResult(result);
    setCheckLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteResult(null);

    const res = await cascadeDeleteProduct(deleteTarget.id);
    setDeleteResult(res);
    setDeleting(false);

    if (res.success) {
      setTimeout(() => {
        setDeleteTarget(null);
        setCheckResult(null);
        setDeleteResult(null);
        onDataChange?.();
      }, 1000);
    }
  };

  const handleCloseDelete = () => {
    setDeleteTarget(null);
    setCheckResult(null);
    setDeleteResult(null);
  };

  if (products.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="text-sm font-medium text-gray-500">No products found</p>
        <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
      </Card>
    );
  }

  return (
    <>
      {/* Desktop Table */}
      <div className="hidden md:block">
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">SKU</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Category</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Stock</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Buy Price</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Sell Price</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product, i) => {
                  const isLowStock = product.quantity <= product.reorderLevel && product.quantity > 0;
                  const condColor = CONDITION_COLORS[product.condition] || { bg: "bg-gray-50", text: "text-gray-700" };
                  const statColor = STATUS_COLORS[product.status] || { bg: "bg-gray-50", text: "text-gray-700" };

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b hover:bg-gray-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {product.image ? (
                            <img src={product.image} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <Badge className={cn("text-[10px] mt-0.5", condColor.bg, condColor.text)}>
                              {product.condition}
                            </Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{product.sku}</td>
                      <td className="px-4 py-3 text-gray-600">{product.category.name}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                          <span className={cn("font-medium", isLowStock ? "text-amber-600" : product.quantity === 0 ? "text-red-600" : "text-gray-900")}>
                            {product.quantity}
                          </span>
                          <span className="text-gray-400 text-xs">{product.unit}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-600">{formatPrice(product.purchasePrice as string)}</td>
                      <td className="px-4 py-3 text-right text-gray-900 font-medium">{formatPrice(product.sellingPrice as string)}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge className={cn("text-xs", statColor.bg, statColor.text)}>
                          {product.status.replace("_", " ")}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`${basePath}/products/${product.id}`}>
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </Link>
                          {role === "ADMIN" && (
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(product)} className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {products.map((product, i) => {
          const isLowStock = product.quantity <= product.reorderLevel && product.quantity > 0;
          const statColor = STATUS_COLORS[product.status] || { bg: "bg-gray-50", text: "text-gray-700" };

          return (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`${basePath}/products/${product.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {product.image ? (
                        <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{product.sku}</p>
                      </div>
                    </div>
                    <Badge className={cn("text-xs", statColor.bg, statColor.text)}>
                      {product.status.replace("_", " ")}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-500">{product.category.name}</span>
                    <div className="flex items-center gap-2">
                      {isLowStock && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                      <span className={cn("font-medium", isLowStock ? "text-amber-600" : product.quantity === 0 ? "text-red-600" : "text-gray-900")}>
                        {product.quantity} {product.unit}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-500">Sell: {formatPrice(product.sellingPrice as string)}</span>
                    <span className="text-emerald-600 font-medium">{Number(product.profitMargin).toFixed(1)}% margin</span>
                  </div>
                </Card>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Delete Confirmation */}
      <DeleteConfirmationModal
        open={!!deleteTarget}
        onClose={handleCloseDelete}
        checkResult={checkResult}
        loading={checkLoading}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
        result={deleteResult}
        entityType="Product"
      />
    </>
  );
}
