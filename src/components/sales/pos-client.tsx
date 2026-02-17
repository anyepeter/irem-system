"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
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
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { createSale, getProductsForPOS } from "@/actions/sale";
import { PaymentModal } from "./payment-modal";
import { formatCurrency, SALE_TYPES, DEFAULT_TAX_PERCENT } from "@/lib/sales-constants";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  User,
  Package,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  name: string;
  sku: string;
  sellingPrice: number | { toString(): string };
  purchasePrice: number | { toString(): string };
  quantity: number;
  unit: string;
  image: string | null;
  category: { id: string; name: string } | null;
};

type CartItem = {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  quantity: number;
  maxQuantity: number;
  image: string | null;
};

type Customer = {
  id: number;
  name: string;
  phone: string;
  isVIP: boolean;
};

type Props = {
  user: { username: string; avatar: string | null; role: string };
  initialProducts: Product[];
  customers: Customer[];
  categories: { id: string; name: string }[];
  basePath: string;
};

export function POSClient({ user, initialProducts, customers, categories, basePath }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleType, setSaleType] = useState("IN_SHOP");
  const [customerId, setCustomerId] = useState<number | undefined>();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState<"FIXED" | "PERCENTAGE">("FIXED");
  const [taxPercent, setTaxPercent] = useState(DEFAULT_TAX_PERCENT);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [createdSale, setCreatedSale] = useState<{ id: string; saleNumber: string; totalAmount: number } | null>(null);
  const [isSearching, startSearchTransition] = useTransition();

  const searchProducts = useCallback(
    (searchTerm: string, category: string) => {
      startSearchTransition(async () => {
        const result = await getProductsForPOS({
          search: searchTerm || undefined,
          category: category === "all" ? undefined : category,
        });
        setProducts(result as unknown as Product[]);
      });
    },
    []
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(search, categoryFilter);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, searchProducts]);

  const addToCart = (product: Product) => {
    const price = Number(product.sellingPrice);
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.quantity) return prev;
        return prev.map((i) =>
          i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          unitPrice: price,
          quantity: 1,
          maxQuantity: product.quantity,
          image: product.image,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          const newQty = i.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > i.maxQuantity) return i;
          return { ...i, quantity: newQty };
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  };

  const subtotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const discountAmount = discountType === "PERCENTAGE" ? (subtotal * discount) / 100 : discount;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (afterDiscount * taxPercent) / 100;
  const totalAmount = afterDiscount + taxAmount;

  const handleCreateSale = () => {
    if (cart.length === 0) return;
    setError("");

    startTransition(async () => {
      const result = await createSale({
        customerId,
        customerName,
        customerPhone,
        saleType,
        items: cart.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
        })),
        discount,
        discountType,
        taxPercent,
        notes,
      });

      if (result.success && result.data) {
        setCreatedSale({
          id: result.data.id as string,
          saleNumber: result.data.saleNumber as string,
          totalAmount,
        });
        setShowPayment(true);
      } else {
        setError(result.message);
      }
    });
  };

  const handlePaymentSuccess = (isPaid: boolean) => {
    setShowPayment(false);
    setCart([]);
    setCustomerId(undefined);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount(0);
    setNotes("");
    setCreatedSale(null);
    searchProducts("", "all");
    if (isPaid) {
      router.push(`${basePath}/sales`);
    }
  };

  const resetSale = () => {
    setCart([]);
    setCustomerId(undefined);
    setCustomerName("");
    setCustomerPhone("");
    setDiscount(0);
    setNotes("");
    setError("");
    setCreatedSale(null);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role as "ADMIN" | "CASHIER" | "TECHNICIAN"} username={user.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header title="Point of Sale" subtitle="Create a new sale" username={user.username} avatar={user.avatar} />

        <div className="p-4 lg:p-6">
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Product Selection */}
          <div className="lg:col-span-2 space-y-4">
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Grid */}
            <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 ${isSearching ? "opacity-50" : ""}`}>
              {products.map((product) => {
                const inCart = cart.find((i) => i.productId === product.id);
                const price = Number(product.sellingPrice);
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="bg-white rounded-xl border border-gray-200 p-3 text-left hover:border-blue-300 hover:shadow-sm transition-all group relative"
                  >
                    {product.image ? (
                      <div className="w-full aspect-square rounded-lg bg-gray-100 mb-2 overflow-hidden">
                        <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-full aspect-square rounded-lg bg-gray-100 mb-2 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sku}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-sm font-bold text-blue-600">{formatCurrency(price)} XAF</p>
                      <p className="text-xs text-gray-400">{product.quantity} {product.unit}</p>
                    </div>
                    {inCart && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-bold">
                        {inCart.quantity}
                      </div>
                    )}
                  </button>
                );
              })}
              {products.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-400">
                  <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No products found</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: Cart & Checkout */}
          <div className="space-y-4">
            {/* Cart */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <button onClick={resetSale} className="text-xs text-red-500 hover:text-red-700">
                    Clear All
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">Add products to the cart</p>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-3 bg-gray-50 rounded-lg p-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">{formatCurrency(item.unitPrice)} XAF</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQuantity(item.productId, -1)}
                          className="w-7 h-7 rounded-lg bg-white border flex items-center justify-center hover:bg-gray-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, 1)}
                          className="w-7 h-7 rounded-lg bg-white border flex items-center justify-center hover:bg-gray-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right min-w-[70px]">
                        <p className="text-sm font-bold">{formatCurrency(item.unitPrice * item.quantity)}</p>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Customer & Sale Options */}
            <Card className="p-4 space-y-3">
              <div>
                <Label className="text-xs">Sale Type</Label>
                <Select value={saleType} onValueChange={setSaleType}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SALE_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs flex items-center gap-1">
                  <User className="w-3 h-3" /> Customer
                </Label>
                <Select
                  value={customerId?.toString() || "walk-in"}
                  onValueChange={(v) => {
                    if (v === "walk-in") {
                      setCustomerId(undefined);
                      setCustomerName("");
                      setCustomerPhone("");
                    } else {
                      const c = customers.find((c) => c.id.toString() === v);
                      if (c) {
                        setCustomerId(c.id);
                        setCustomerName(c.name);
                        setCustomerPhone(c.phone);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Walk-in Customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id.toString()}>
                        {c.name} {c.isVIP ? "(VIP)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!customerId && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">Name</Label>
                    <Input
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Optional"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Optional"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Discount</Label>
                  <div className="flex gap-1 mt-1">
                    <Input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={(e) => setDiscount(Number(e.target.value))}
                      className="flex-1"
                    />
                    <Select value={discountType} onValueChange={(v) => setDiscountType(v as "FIXED" | "PERCENTAGE")}>
                      <SelectTrigger className="w-[70px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FIXED">XAF</SelectItem>
                        <SelectItem value="PERCENTAGE">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Tax %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={taxPercent}
                    onChange={(e) => setTaxPercent(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Notes</Label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[50px] resize-y"
                  placeholder="Optional notes"
                />
              </div>
            </Card>

            {/* Totals & Checkout */}
            <Card className="p-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)} XAF</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discountAmount)} XAF</span>
                  </div>
                )}
                {taxAmount > 0 && (
                  <div className="flex justify-between text-gray-600">
                    <span>Tax ({taxPercent}%)</span>
                    <span>{formatCurrency(taxAmount)} XAF</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(totalAmount)} XAF</span>
                </div>
              </div>

              <Button
                onClick={handleCreateSale}
                disabled={cart.length === 0 || isPending}
                className="w-full mt-4"
                size="lg"
              >
                {isPending ? "Creating Sale..." : `Checkout - ${formatCurrency(totalAmount)} XAF`}
              </Button>
            </Card>
          </div>
        </div>
      </div>

        {/* Payment Modal */}
        {createdSale && (
          <PaymentModal
            open={showPayment}
            onClose={() => setShowPayment(false)}
            saleId={createdSale.id}
            saleNumber={createdSale.saleNumber}
            totalAmount={createdSale.totalAmount}
            amountDue={createdSale.totalAmount}
            onSuccess={handlePaymentSuccess}
          />
        )}
      </div>
    </div>
  );
}
