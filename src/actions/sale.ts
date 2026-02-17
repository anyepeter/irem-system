"use server";

import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { createSaleSchema, salePaymentSchema } from "@/lib/validations";
import { Prisma } from "@prisma/client";

export type ActionResult = {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
};

// ─── Access Helpers ──────────────────────────────────────────

async function requireSalesAccess() {
  const user = await getCurrentDbUser();
  if (!user) return { error: "Not authenticated", user: null };
  if (user.role === "TECHNICIAN") {
    return { error: "You do not have access to sales", user: null };
  }
  return { error: null, user };
}

// ─── Helpers ────────────────────────────────────────────────

async function generateSaleNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `SAL-${year}`;
  const count = await db.sale.count({
    where: { saleNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

async function generatePaymentNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PAY-${year}`;
  const count = await db.salePayment.count({
    where: { paymentNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

function revalidateSalesPaths() {
  revalidatePath("/admin/sales");
  revalidatePath("/cashier/sales");
  revalidatePath("/admin/dashboard");
  revalidatePath("/cashier/dashboard");
}

// ─── Create Sale ────────────────────────────────────────────

export async function createSale(data: {
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  saleType: string;
  items: { productId: string; quantity: number; unitPrice: number }[];
  discount: number;
  discountType?: string;
  taxPercent: number;
  notes?: string;
}): Promise<ActionResult> {
  try {
    const { error, user } = await requireSalesAccess();
    if (error || !user) return { success: false, message: error || "Not authenticated" };

    const validation = createSaleSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return { success: false, message: Object.values(errors)[0]?.[0] ?? "Validation failed" };
    }

    const d = validation.data;

    // Verify all products exist and have enough stock
    const productIds = d.items.map((i) => i.productId);
    const products = await db.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, sku: true, quantity: true, purchasePrice: true, sellingPrice: true, status: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of d.items) {
      const product = productMap.get(item.productId);
      if (!product) return { success: false, message: `Product not found` };
      if (product.quantity < item.quantity) {
        return { success: false, message: `Insufficient stock for ${product.name}. Available: ${product.quantity}` };
      }
    }

    // Calculate totals
    const saleItems = d.items.map((item) => {
      const product = productMap.get(item.productId)!;
      const subtotal = item.unitPrice * item.quantity;
      const unitCost = Number(product.purchasePrice);
      const profit = (item.unitPrice - unitCost) * item.quantity;
      return {
        productId: item.productId,
        productName: product.name,
        productSKU: product.sku,
        quantity: item.quantity,
        unitPrice: new Prisma.Decimal(item.unitPrice),
        discount: new Prisma.Decimal(0),
        subtotal: new Prisma.Decimal(subtotal),
        total: new Prisma.Decimal(subtotal),
        unitCost: new Prisma.Decimal(unitCost),
        profit: new Prisma.Decimal(profit),
      };
    });

    const subtotal = saleItems.reduce((sum, i) => sum + Number(i.subtotal), 0);
    const discountAmount = d.discountType === "PERCENTAGE"
      ? (subtotal * d.discount) / 100
      : d.discount;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = (afterDiscount * d.taxPercent) / 100;
    const totalAmount = afterDiscount + taxAmount;

    const saleNumber = await generateSaleNumber();

    const sale = await db.sale.create({
      data: {
        saleNumber,
        customerId: d.customerId || null,
        customerName: d.customerName || null,
        customerPhone: d.customerPhone || null,
        saleType: d.saleType as "IN_SHOP" | "CREDIT",
        subtotal: new Prisma.Decimal(subtotal),
        discount: new Prisma.Decimal(discountAmount),
        discountType: d.discountType as "PERCENTAGE" | "FIXED" | undefined,
        tax: new Prisma.Decimal(taxAmount),
        taxPercent: new Prisma.Decimal(d.taxPercent),
        totalAmount: new Prisma.Decimal(totalAmount),
        amountPaid: new Prisma.Decimal(0),
        amountDue: new Prisma.Decimal(totalAmount),
        status: "PENDING",
        paymentStatus: "UNPAID",
        notes: d.notes || null,
        createdById: user.id,
        items: { create: saleItems },
      },
    });

    revalidateSalesPaths();
    return {
      success: true,
      message: `Sale ${saleNumber} created successfully`,
      data: { id: sale.id, saleNumber },
    };
  } catch (err) {
    console.error("Create sale error:", err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// ─── Process Payment ────────────────────────────────────────

export async function processPayment(data: {
  saleId: string;
  amount: number;
  paymentMethod: string;
  mobileMoneyNumber?: string;
  transactionId?: string;
  bankName?: string;
  transferReference?: string;
  notes?: string;
}): Promise<ActionResult> {
  try {
    const { error, user } = await requireSalesAccess();
    if (error || !user) return { success: false, message: error || "Not authenticated" };

    const validation = salePaymentSchema.safeParse(data);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return { success: false, message: Object.values(errors)[0]?.[0] ?? "Validation failed" };
    }

    const d = validation.data;

    const sale = await db.sale.findUnique({
      where: { id: d.saleId },
      include: { items: true },
    });
    if (!sale) return { success: false, message: "Sale not found" };
    if (sale.status === "CANCELLED") return { success: false, message: "Cannot pay a cancelled sale" };

    const newAmountPaid = Number(sale.amountPaid) + d.amount;
    const totalAmount = Number(sale.totalAmount);
    const newAmountDue = Math.max(0, totalAmount - newAmountPaid);

    const isPaid = newAmountPaid >= totalAmount;
    const paymentStatus = isPaid ? "PAID" : newAmountPaid > 0 ? "PARTIALLY_PAID" : "UNPAID";
    const saleStatus = isPaid ? "PAID" : sale.status;

    const paymentNumber = await generatePaymentNumber();

    // Transaction: create payment, update sale, deduct stock if fully paid
    await db.$transaction(async (tx) => {
      // Create payment record
      await tx.salePayment.create({
        data: {
          paymentNumber,
          saleId: d.saleId,
          amount: new Prisma.Decimal(d.amount),
          paymentMethod: d.paymentMethod as "CASH" | "MOBILE_MONEY_MTN" | "MOBILE_MONEY_ORANGE" | "BANK_TRANSFER" | "CREDIT",
          mobileMoneyNumber: d.mobileMoneyNumber || null,
          transactionId: d.transactionId || null,
          bankName: d.bankName || null,
          transferReference: d.transferReference || null,
          notes: d.notes || null,
          createdById: user.id,
        },
      });

      // Update sale
      await tx.sale.update({
        where: { id: d.saleId },
        data: {
          amountPaid: new Prisma.Decimal(newAmountPaid),
          amountDue: new Prisma.Decimal(newAmountDue),
          paymentStatus: paymentStatus as "UNPAID" | "PARTIALLY_PAID" | "PAID",
          status: saleStatus as "PENDING" | "PAID" | "COMPLETED" | "CANCELLED",
          completedAt: isPaid ? new Date() : undefined,
        },
      });

      // Deduct stock on first full payment
      if (isPaid && sale.paymentStatus !== "PAID") {
        for (const item of sale.items) {
          // Update product stock
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: { decrement: item.quantity },
            },
          });

          // Check if now out of stock
          const updated = await tx.product.findUnique({
            where: { id: item.productId },
            select: { quantity: true },
          });
          if (updated && updated.quantity === 0) {
            await tx.product.update({
              where: { id: item.productId },
              data: { status: "OUT_OF_STOCK" },
            });
          }

          // Record stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "OUT",
              quantity: item.quantity,
              reason: `Sale: ${sale.saleNumber}`,
              reference: sale.saleNumber,
              createdById: user.id,
            },
          });
        }
      }
    });

    revalidateSalesPaths();
    revalidatePath("/admin/inventory");
    revalidatePath("/cashier/inventory");

    return {
      success: true,
      message: isPaid
        ? `Payment complete! Sale ${sale.saleNumber} is fully paid.`
        : `Payment of ${d.amount.toLocaleString()} recorded. Remaining: ${newAmountDue.toLocaleString()}`,
      data: { paymentNumber, isPaid },
    };
  } catch (err) {
    console.error("Process payment error:", err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// ─── Get Sales ──────────────────────────────────────────────

export async function getSales(params?: {
  search?: string;
  status?: string;
  paymentStatus?: string;
  saleType?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { error } = await requireSalesAccess();
    if (error) return { sales: [], total: 0 };

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {};

    if (params?.search?.trim()) {
      const search = params.search.trim();
      where.OR = [
        { saleNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (params?.status && params.status !== "ALL") {
      where.status = params.status as "PENDING" | "PAID" | "COMPLETED" | "CANCELLED";
    }
    if (params?.paymentStatus && params.paymentStatus !== "ALL") {
      where.paymentStatus = params.paymentStatus as "UNPAID" | "PARTIALLY_PAID" | "PAID";
    }
    if (params?.saleType && params.saleType !== "ALL") {
      where.saleType = params.saleType as "IN_SHOP" | "CREDIT";
    }

    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true, isVIP: true } },
          createdBy: { select: { username: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.sale.count({ where }),
    ]);

    return { sales, total };
  } catch {
    return { sales: [], total: 0 };
  }
}

// ─── Get Sale By ID ─────────────────────────────────────────

export async function getSaleById(id: string) {
  try {
    const { error } = await requireSalesAccess();
    if (error) return null;

    return await db.sale.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true, phone: true, isVIP: true } },
        createdBy: { select: { username: true } },
        items: {
          include: { product: { select: { id: true, image: true } } },
        },
        payments: {
          include: { createdBy: { select: { username: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch {
    return null;
  }
}

// ─── Cancel Sale ────────────────────────────────────────────

export async function cancelSale(id: string, reason?: string): Promise<ActionResult> {
  try {
    const user = await getCurrentDbUser();
    if (!user) return { success: false, message: "Not authenticated" };
    if (user.role !== "ADMIN") return { success: false, message: "Only admins can cancel sales" };

    const sale = await db.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) return { success: false, message: "Sale not found" };
    if (sale.status === "CANCELLED") return { success: false, message: "Sale is already cancelled" };

    await db.$transaction(async (tx) => {
      // If stock was deducted (sale was paid), restore it
      if (sale.paymentStatus === "PAID") {
        for (const item of sale.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: { increment: item.quantity },
              status: "ACTIVE",
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "RETURN",
              quantity: item.quantity,
              reason: `Sale cancelled: ${sale.saleNumber}`,
              reference: sale.saleNumber,
              createdById: user.id,
            },
          });
        }
      }

      await tx.sale.update({
        where: { id },
        data: {
          status: "CANCELLED",
          notes: reason ? `${sale.notes || ""}\nCancelled: ${reason}`.trim() : sale.notes,
        },
      });
    });

    revalidateSalesPaths();
    revalidatePath("/admin/inventory");
    revalidatePath("/cashier/inventory");
    return { success: true, message: "Sale cancelled successfully" };
  } catch (err) {
    console.error("Cancel sale error:", err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// ─── Get Products for POS ───────────────────────────────────

export async function getProductsForPOS(params?: {
  search?: string;
  category?: string;
}) {
  try {
    const { error } = await requireSalesAccess();
    if (error) return [];

    const where: Prisma.ProductWhereInput = {
      status: "ACTIVE",
      quantity: { gt: 0 },
    };

    if (params?.search?.trim()) {
      where.OR = [
        { name: { contains: params.search.trim(), mode: "insensitive" } },
        { sku: { contains: params.search.trim(), mode: "insensitive" } },
      ];
    }
    if (params?.category) {
      where.categoryId = params.category;
    }

    return await db.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        sellingPrice: true,
        purchasePrice: true,
        quantity: true,
        unit: true,
        image: true,
        category: { select: { id: true, name: true } },
      },
      orderBy: { name: "asc" },
      take: 50,
    });
  } catch {
    return [];
  }
}

// ─── Sales Stats ────────────────────────────────────────────

export async function getSalesStats() {
  try {
    const { error } = await requireSalesAccess();
    if (error) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todaySales,
      todayRevenue,
      monthSales,
      monthRevenue,
      creditSalesCount,
      creditTotal,
    ] = await Promise.all([
      db.sale.count({
        where: { createdAt: { gte: today }, status: { not: "CANCELLED" } },
      }),
      db.sale.aggregate({
        where: { createdAt: { gte: today }, paymentStatus: { in: ["PAID", "PARTIALLY_PAID"] } },
        _sum: { amountPaid: true },
      }),
      db.sale.count({
        where: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" } },
      }),
      db.sale.aggregate({
        where: { createdAt: { gte: monthStart }, paymentStatus: { in: ["PAID", "PARTIALLY_PAID"] } },
        _sum: { amountPaid: true },
      }),
      db.sale.count({
        where: { saleType: "CREDIT", paymentStatus: { not: "PAID" }, status: { not: "CANCELLED" } },
      }),
      db.sale.aggregate({
        where: { saleType: "CREDIT", paymentStatus: { not: "PAID" }, status: { not: "CANCELLED" } },
        _sum: { amountDue: true },
      }),
    ]);

    // Calculate profit this month
    const monthItems = await db.saleItem.findMany({
      where: {
        sale: { createdAt: { gte: monthStart }, status: { not: "CANCELLED" }, paymentStatus: "PAID" },
      },
      select: { profit: true },
    });
    const monthProfit = monthItems.reduce((sum, i) => sum + Number(i.profit), 0);

    return {
      todaySales,
      todayRevenue: Number(todayRevenue._sum.amountPaid || 0),
      monthSales,
      monthRevenue: Number(monthRevenue._sum.amountPaid || 0),
      monthProfit,
      creditSalesCount,
      creditTotal: Number(creditTotal._sum.amountDue || 0),
    };
  } catch {
    return null;
  }
}

// ─── Credit Sales ───────────────────────────────────────────

export async function getCreditSales(params?: { page?: number; limit?: number }) {
  try {
    const { error } = await requireSalesAccess();
    if (error) return { sales: [], total: 0 };

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {
      saleType: "CREDIT",
      paymentStatus: { not: "PAID" },
      status: { not: "CANCELLED" },
    };

    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          createdBy: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.sale.count({ where }),
    ]);

    return { sales, total };
  } catch {
    return { sales: [], total: 0 };
  }
}

// ─── Sales Report ───────────────────────────────────────────

export async function getSalesReport(params?: {
  dateFrom?: string;
  dateTo?: string;
}) {
  try {
    const { error } = await requireSalesAccess();
    if (error) return null;

    const where: Prisma.SaleWhereInput = { status: { not: "CANCELLED" } };

    if (params?.dateFrom || params?.dateTo) {
      where.createdAt = {};
      if (params?.dateFrom) where.createdAt.gte = new Date(params.dateFrom);
      if (params?.dateTo) {
        const end = new Date(params.dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const sales = await db.sale.findMany({
      where,
      include: {
        items: { select: { profit: true, quantity: true, productName: true, total: true } },
        payments: { select: { paymentMethod: true, amount: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.amountPaid), 0);
    const totalProfit = sales.reduce(
      (sum, s) => sum + s.items.reduce((iSum, i) => iSum + Number(i.profit), 0),
      0
    );

    // Payment method breakdown
    const byMethod: Record<string, { count: number; total: number }> = {};
    for (const sale of sales) {
      for (const payment of sale.payments) {
        const method = payment.paymentMethod;
        if (!byMethod[method]) byMethod[method] = { count: 0, total: 0 };
        byMethod[method].count += 1;
        byMethod[method].total += Number(payment.amount);
      }
    }

    // Top products
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    for (const sale of sales) {
      for (const item of sale.items) {
        if (!productSales[item.productName]) {
          productSales[item.productName] = { name: item.productName, quantity: 0, revenue: 0 };
        }
        productSales[item.productName].quantity += item.quantity;
        productSales[item.productName].revenue += Number(item.total);
      }
    }

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return {
      totalSales: sales.length,
      totalRevenue,
      totalProfit,
      avgOrderValue: sales.length > 0 ? totalRevenue / sales.length : 0,
      profitMargin: totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0,
      byMethod,
      topProducts,
    };
  } catch {
    return null;
  }
}

// ─── Delete Sale (Admin Only) ──────────────────────────────

export async function deleteSale(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentDbUser();
    if (!user) return { success: false, message: "Not authenticated" };
    if (user.role !== "ADMIN") return { success: false, message: "Only admins can delete sales" };

    const sale = await db.sale.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!sale) return { success: false, message: "Sale not found" };

    await db.$transaction(async (tx) => {
      // If stock was deducted (sale was paid), restore it
      if (sale.paymentStatus === "PAID") {
        for (const item of sale.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              quantity: { increment: item.quantity },
              status: "ACTIVE",
            },
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: "RETURN",
              quantity: item.quantity,
              reason: `Sale deleted: ${sale.saleNumber}`,
              reference: sale.saleNumber,
              createdById: user.id,
            },
          });
        }
      }

      // Delete the sale (cascades to items and payments)
      await tx.sale.delete({ where: { id } });
    });

    revalidateSalesPaths();
    revalidatePath("/admin/inventory");
    revalidatePath("/cashier/inventory");
    return { success: true, message: "Sale deleted successfully" };
  } catch (err) {
    console.error("Delete sale error:", err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// ─── Get Today's Sales ─────────────────────────────────────

export async function getTodaySales(params?: {
  search?: string;
  status?: string;
  paymentStatus?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { error } = await requireSalesAccess();
    if (error) return { sales: [], total: 0 };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.SaleWhereInput = {
      createdAt: { gte: today },
    };

    if (params?.search?.trim()) {
      const search = params.search.trim();
      where.OR = [
        { saleNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (params?.status && params.status !== "ALL") {
      where.status = params.status as "PENDING" | "PAID" | "COMPLETED" | "CANCELLED";
    }
    if (params?.paymentStatus && params.paymentStatus !== "ALL") {
      where.paymentStatus = params.paymentStatus as "UNPAID" | "PARTIALLY_PAID" | "PAID";
    }

    const [sales, total] = await Promise.all([
      db.sale.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true, isVIP: true } },
          createdBy: { select: { username: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.sale.count({ where }),
    ]);

    return { sales, total };
  } catch {
    return { sales: [], total: 0 };
  }
}
