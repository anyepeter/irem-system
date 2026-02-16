"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProduct, updateProduct } from "@/actions/inventory";
import { PRODUCT_CONDITIONS, PRODUCT_STATUSES, UNITS } from "@/lib/inventory-constants";
import { Package, Upload, Save, ArrowLeft } from "lucide-react";

type Category = { id: string; name: string };

type ProductData = {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  quantity: number;
  reorderLevel: number;
  unit: string;
  purchasePrice: unknown;
  sellingPrice: unknown;
  condition: string;
  status: string;
  supplier: string | null;
  image: string | null;
};

type Props = {
  categories: Category[];
  product?: ProductData;
  backPath: string;
};

export function ProductForm({ categories, product, backPath }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(product?.image || null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = product
        ? await updateProduct(product.id, formData)
        : await createProduct(formData);

      if (result.success) {
        router.push(backPath);
        router.refresh();
      } else {
        setError(result.message);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <Button type="button" variant="ghost" size="sm" onClick={() => router.push(backPath)}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <h2 className="text-lg font-semibold">{product ? "Edit Product" : "Add New Product"}</h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input id="name" name="name" defaultValue={product?.name || ""} required />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <textarea
                  id="description"
                  name="description"
                  defaultValue={product?.description || ""}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-y"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select name="categoryId" defaultValue={product?.categoryId || ""} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="condition">Condition *</Label>
                  <Select name="condition" defaultValue={product?.condition || "NEW"}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CONDITIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Input id="supplier" name="supplier" defaultValue={product?.supplier || ""} />
              </div>

              {product && (
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select name="status" defaultValue={product.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pricing & Stock</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="purchasePrice">Purchase Price *</Label>
                  <Input
                    id="purchasePrice"
                    name="purchasePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={product ? Number(product.purchasePrice) : ""}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="sellingPrice">Selling Price *</Label>
                  <Input
                    id="sellingPrice"
                    name="sellingPrice"
                    type="number"
                    step="0.01"
                    min="0"
                    defaultValue={product ? Number(product.sellingPrice) : ""}
                    required
                  />
                </div>
              </div>

              {!product && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="quantity">Initial Quantity *</Label>
                    <Input id="quantity" name="quantity" type="number" min="0" defaultValue="0" required />
                  </div>
                  <div>
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input id="reorderLevel" name="reorderLevel" type="number" min="0" defaultValue="5" />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select name="unit" defaultValue="pcs">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {product && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="reorderLevel">Reorder Level</Label>
                    <Input id="reorderLevel" name="reorderLevel" type="number" min="0" defaultValue={product.reorderLevel} />
                  </div>
                  <div>
                    <Label htmlFor="unit">Unit</Label>
                    <Select name="unit" defaultValue={product.unit}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNITS.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Image */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Product Image</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-48 bg-gray-100 rounded-xl flex flex-col items-center justify-center">
                    <Package className="w-10 h-10 text-gray-300 mb-2" />
                    <p className="text-xs text-gray-400">No image</p>
                  </div>
                )}
                <label className="flex items-center gap-2 justify-center w-full py-2 px-3 border border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors text-sm text-gray-600">
                  <Upload className="w-4 h-4" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    name="image"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={isPending}>
            <Save className="w-4 h-4 mr-2" />
            {isPending ? "Saving..." : product ? "Update Product" : "Create Product"}
          </Button>
        </div>
      </div>
    </form>
  );
}
