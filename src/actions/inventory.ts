"use server";

import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import {
  createProductSchema,
  updateProductSchema,
  stockAdjustmentSchema,
  createCategorySchema2,
} from "@/lib/validations";
import { calculateProfitMargin, SKU_PREFIX } from "@/lib/inventory-constants";
import { uploadProductImage } from "@/lib/cloudinary";
import { Prisma } from "@prisma/client";

export type ActionResult = {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
};

async function requireInventoryAccess() {
  const user = await getCurrentDbUser();
  if (!user) return { error: "Not authenticated", user: null };
  return { error: null, user };
}

async function requireInventoryWrite() {
  const user = await getCurrentDbUser();
  if (!user) return { error: "Not authenticated", user: null };
  if (user.role === "TECHNICIAN") {
    return { error: "You do not have permission to manage inventory", user: null };
  }
  return { error: null, user };
}

// ─── SKU Generation ──────────────────────────────────────────────────────────
async function generateSKU(): Promise<string> {
  const count = await db.product.count();
  const num = (count + 1).toString().padStart(5, "0");
  const sku = `${SKU_PREFIX}-${num}`;
  const exists = await db.product.findUnique({ where: { sku } });
  if (exists) {
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${SKU_PREFIX}-${rand}${num.slice(-3)}`;
  }
  return sku;
}

// ─── Category CRUD ───────────────────────────────────────────────────────────
export async function createCategory(formData: FormData): Promise<ActionResult> {
  try {
    const { error, user } = await requireInventoryWrite();
    if (error || !user) return { success: false, message: error || "Not authenticated" };

    const rawData = {
      name: (formData.get("name") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || "",
    };

    const validation = createCategorySchema2.safeParse(rawData);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return { success: false, message: Object.values(errors)[0]?.[0] ?? "Validation failed" };
    }

    const existing = await db.category.findUnique({ where: { name: validation.data.name } });
    if (existing) {
      return { success: false, message: "A category with this name already exists" };
    }

    const category = await db.category.create({
      data: {
        name: validation.data.name,
        description: validation.data.description || null,
        createdById: user.id,
      },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/cashier/inventory");
    return {
      success: true,
      message: `Category "${category.name}" created successfully`,
      data: { id: category.id, name: category.name },
    };
  } catch (error) {
    console.error("Create category error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function getCategories() {
  try {
    const { error } = await requireInventoryAccess();
    if (error) return [];

    return await db.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
    });
  } catch {
    return [];
  }
}

export async function updateCategory(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const { error, user } = await requireInventoryWrite();
    if (error || !user) return { success: false, message: error || "Not authenticated" };

    const rawData = {
      name: (formData.get("name") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || "",
    };

    const validation = createCategorySchema2.safeParse(rawData);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return { success: false, message: Object.values(errors)[0]?.[0] ?? "Validation failed" };
    }

    const existing = await db.category.findFirst({
      where: { name: validation.data.name, NOT: { id } },
    });
    if (existing) {
      return { success: false, message: "A category with this name already exists" };
    }

    await db.category.update({
      where: { id },
      data: { name: validation.data.name, description: validation.data.description || null },
    });

    revalidatePath("/admin/inventory");
    revalidatePath("/cashier/inventory");
    return { success: true, message: "Category updated successfully" };
  } catch (error) {
    console.error("Update category error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentDbUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, message: "Only admins can delete categories" };
    }

    const category = await db.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!category) return { success: false, message: "Category not found" };
    if (category._count.products > 0) {
      return { success: false, message: "Cannot delete category with existing products" };
    }

    await db.category.delete({ where: { id } });
    revalidatePath("/admin/inventory");
    return { success: true, message: "Category deleted successfully" };
  } catch (error) {
    console.error("Delete category error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// ─── Product CRUD ────────────────────────────────────────────────────────────
export async function createProduct(formData: FormData): Promise<ActionResult> {
  try {
    const { error, user } = await requireInventoryWrite();
    if (error || !user) return { success: false, message: error || "Not authenticated" };

    const rawData = {
      name: (formData.get("name") as string)?.trim(),
      description: (formData.get("description") as string)?.trim() || "",
      categoryId: formData.get("categoryId") as string,
      quantity: formData.get("quantity") as string,
      reorderLevel: formData.get("reorderLevel") as string,
      unit: formData.get("unit") as string,
      purchasePrice: formData.get("purchasePrice") as string,
      sellingPrice: formData.get("sellingPrice") as string,
      condition: formData.get("condition") as string,
      supplier: (formData.get("supplier") as string)?.trim() || "",
      image: "",
    };

    // Handle image upload
    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const uploadResult = await uploadProductImage(imageFile);
      if ("error" in uploadResult) {
        return { success: false, message: uploadResult.error };
      }
      rawData.image = uploadResult.url;
    }

    const validation = createProductSchema.safeParse(rawData);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return { success: false, message: Object.values(errors)[0]?.[0] ?? "Validation failed" };
    }

    const sku = await generateSKU();
    const profitMargin = calculateProfitMargin(
      validation.data.purchasePrice,
      validation.data.sellingPrice
    );

    const product = await db.product.create({
      data: {
        sku,
        name: validation.data.name,
        description: validation.data.description || null,
        categoryId: validation.data.categoryId,
        quantity: validation.data.quantity,
        reorderLevel: validation.data.reorderLevel,
        unit: validation.data.unit,
        purchasePrice: new Prisma.Decimal(validation.data.purchasePrice),
        sellingPrice: new Prisma.Decimal(validation.data.sellingPrice),
        profitMargin: new Prisma.Decimal(profitMargin),
        condition: validation.data.condition,
        supplier: validation.data.supplier || null,
        image: rawData.image || null,
        status: validation.data.quantity === 0 ? "OUT_OF_STOCK" : "ACTIVE",
        lastRestockedAt: validation.data.quantity > 0 ? new Date() : null,
        createdById: user.id,
      },
    });

    // Create initial stock-in movement if quantity > 0
    if (validation.data.quantity > 0) {
      await db.stockMovement.create({
        data: {
          productId: product.id,
          type: "IN",
          quantity: validation.data.quantity,
          reason: "Initial stock",
          createdById: user.id,
        },
      });
    }

    // Check low stock
    if (validation.data.quantity <= validation.data.reorderLevel) {
      await db.lowStockAlert.create({
        data: {
          productId: product.id,
          threshold: validation.data.reorderLevel,
        },
      });
    }

    revalidatePath("/admin/inventory");
    revalidatePath("/cashier/inventory");
    return {
      success: true,
      message: `Product "${product.name}" (${sku}) created successfully`,
      data: { id: product.id, sku },
    };
  } catch (error) {
    console.error("Create product error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function getProducts(params?: {
  search?: string;
  category?: string;
  status?: string;
  condition?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { error } = await requireInventoryAccess();
    if (error) return { products: [], total: 0 };

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = (page - 1) * limit;
    const search = params?.search?.trim();

    const where: Prisma.ProductWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { supplier: { contains: search, mode: "insensitive" } },
      ];
    }
    if (params?.category) where.categoryId = params.category;
    if (params?.status) where.status = params.status as "ACTIVE" | "DISCONTINUED" | "OUT_OF_STOCK";
    if (params?.condition) where.condition = params.condition as "NEW" | "REFURBISHED" | "USED";

    const [products, total] = await Promise.all([
      db.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          createdBy: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.product.count({ where }),
    ]);

    return { products, total };
  } catch {
    return { products: [], total: 0 };
  }
}

export async function getProductById(id: string) {
  try {
    const { error } = await requireInventoryAccess();
    if (error) return null;

    return await db.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        createdBy: { select: { username: true } },
        stockMovements: {
          include: { createdBy: { select: { username: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        lowStockAlerts: { where: { isActive: true } },
      },
    });
  } catch {
    return null;
  }
}

export async function updateProduct(id: string, formData: FormData): Promise<ActionResult> {
  try {
    const { error, user } = await requireInventoryWrite();
    if (error || !user) return { success: false, message: error || "Not authenticated" };

    const product = await db.product.findUnique({ where: { id } });
    if (!product) return { success: false, message: "Product not found" };

    const rawData: Record<string, unknown> = {};
    const fields = ["name", "description", "categoryId", "reorderLevel", "unit", "purchasePrice", "sellingPrice", "condition", "status", "supplier"];
    for (const field of fields) {
      const val = formData.get(field);
      if (val !== null && val !== undefined) {
        rawData[field] = typeof val === "string" ? val.trim() : val;
      }
    }

    // Handle image upload
    const imageFile = formData.get("image") as File | null;
    if (imageFile && imageFile.size > 0) {
      const uploadResult = await uploadProductImage(imageFile);
      if ("error" in uploadResult) {
        return { success: false, message: uploadResult.error };
      }
      rawData.image = uploadResult.url;
    }

    const validation = updateProductSchema.safeParse(rawData);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return { success: false, message: Object.values(errors)[0]?.[0] ?? "Validation failed" };
    }

    const updateData: Prisma.ProductUpdateInput = {};
    if (validation.data.name) updateData.name = validation.data.name;
    if (validation.data.description !== undefined) updateData.description = validation.data.description || null;
    if (validation.data.categoryId) updateData.category = { connect: { id: validation.data.categoryId } };
    if (validation.data.reorderLevel !== undefined) updateData.reorderLevel = validation.data.reorderLevel;
    if (validation.data.unit) updateData.unit = validation.data.unit;
    if (validation.data.condition) updateData.condition = validation.data.condition;
    if (validation.data.status) updateData.status = validation.data.status;
    if (validation.data.supplier !== undefined) updateData.supplier = validation.data.supplier || null;
    if (rawData.image) updateData.image = rawData.image as string;

    if (validation.data.purchasePrice !== undefined || validation.data.sellingPrice !== undefined) {
      const purchase = validation.data.purchasePrice ?? Number(product.purchasePrice);
      const selling = validation.data.sellingPrice ?? Number(product.sellingPrice);
      if (validation.data.purchasePrice !== undefined) updateData.purchasePrice = new Prisma.Decimal(purchase);
      if (validation.data.sellingPrice !== undefined) updateData.sellingPrice = new Prisma.Decimal(selling);
      updateData.profitMargin = new Prisma.Decimal(calculateProfitMargin(purchase, selling));
    }

    await db.product.update({ where: { id }, data: updateData });

    revalidatePath("/admin/inventory");
    revalidatePath("/cashier/inventory");
    return { success: true, message: "Product updated successfully" };
  } catch (error) {
    console.error("Update product error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  try {
    const user = await getCurrentDbUser();
    if (!user || user.role !== "ADMIN") {
      return { success: false, message: "Only admins can delete products" };
    }

    const product = await db.product.findUnique({ where: { id } });
    if (!product) return { success: false, message: "Product not found" };

    await db.product.delete({ where: { id } });

    revalidatePath("/admin/inventory");
    revalidatePath("/cashier/inventory");
    return { success: true, message: "Product deleted successfully" };
  } catch (error) {
    console.error("Delete product error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// ─── Stock Management ────────────────────────────────────────────────────────
export async function adjustStock(formData: FormData): Promise<ActionResult> {
  try {
    const { error, user } = await requireInventoryWrite();
    if (error || !user) return { success: false, message: error || "Not authenticated" };

    const rawData = {
      productId: formData.get("productId") as string,
      type: formData.get("type") as string,
      quantity: formData.get("quantity") as string,
      reason: (formData.get("reason") as string)?.trim(),
      notes: (formData.get("notes") as string)?.trim() || "",
      reference: (formData.get("reference") as string)?.trim() || "",
    };

    const validation = stockAdjustmentSchema.safeParse(rawData);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      return { success: false, message: Object.values(errors)[0]?.[0] ?? "Validation failed" };
    }

    const product = await db.product.findUnique({ where: { id: validation.data.productId } });
    if (!product) return { success: false, message: "Product not found" };

    const { type, quantity } = validation.data;
    let newQuantity = product.quantity;

    if (type === "IN" || type === "RETURN") {
      newQuantity += quantity;
    } else if (type === "OUT" || type === "DAMAGE") {
      if (product.quantity < quantity) {
        return { success: false, message: `Insufficient stock. Available: ${product.quantity}` };
      }
      newQuantity -= quantity;
    } else {
      // ADJUSTMENT - can be positive or negative, quantity is absolute value set
      newQuantity = quantity;
    }

    // Update product quantity and status
    const newStatus = newQuantity === 0 ? "OUT_OF_STOCK" : product.status === "OUT_OF_STOCK" ? "ACTIVE" : product.status;

    await db.product.update({
      where: { id: validation.data.productId },
      data: {
        quantity: newQuantity,
        status: newStatus,
        lastRestockedAt: type === "IN" || type === "RETURN" ? new Date() : undefined,
      },
    });

    // Record movement
    await db.stockMovement.create({
      data: {
        productId: validation.data.productId,
        type: validation.data.type,
        quantity: validation.data.quantity,
        reason: validation.data.reason,
        notes: validation.data.notes || null,
        reference: validation.data.reference || null,
        createdById: user.id,
      },
    });

    // Check low stock alert
    if (newQuantity <= product.reorderLevel) {
      const existingAlert = await db.lowStockAlert.findFirst({
        where: { productId: product.id, isActive: true },
      });
      if (!existingAlert) {
        await db.lowStockAlert.create({
          data: { productId: product.id, threshold: product.reorderLevel },
        });
      }
    }

    revalidatePath("/admin/inventory");
    revalidatePath("/cashier/inventory");
    return { success: true, message: `Stock ${type.toLowerCase()} recorded successfully. New quantity: ${newQuantity}` };
  } catch (error) {
    console.error("Adjust stock error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function getStockMovements(params?: {
  productId?: string;
  type?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { error } = await requireInventoryAccess();
    if (error) return { movements: [], total: 0 };

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.StockMovementWhereInput = {};
    if (params?.productId) where.productId = params.productId;
    if (params?.type) where.type = params.type as "IN" | "OUT" | "ADJUSTMENT" | "RETURN" | "DAMAGE";

    const [movements, total] = await Promise.all([
      db.stockMovement.findMany({
        where,
        include: {
          product: { select: { name: true, sku: true } },
          createdBy: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.stockMovement.count({ where }),
    ]);

    return { movements, total };
  } catch {
    return { movements: [], total: 0 };
  }
}

// ─── Alerts ──────────────────────────────────────────────────────────────────
export async function getLowStockAlerts() {
  try {
    const { error } = await requireInventoryAccess();
    if (error) return [];

    return await db.lowStockAlert.findMany({
      where: { isActive: true },
      include: {
        product: {
          select: { id: true, name: true, sku: true, quantity: true, reorderLevel: true, unit: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function dismissAlert(id: string): Promise<ActionResult> {
  try {
    const { error, user } = await requireInventoryWrite();
    if (error || !user) return { success: false, message: error || "Not authenticated" };

    await db.lowStockAlert.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/admin/inventory");
    return { success: true, message: "Alert dismissed" };
  } catch (error) {
    console.error("Dismiss alert error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// ─── Stats & Reports ─────────────────────────────────────────────────────────
export async function getInventoryStats() {
  try {
    const { error } = await requireInventoryAccess();
    if (error) return { totalProducts: 0, lowStockCount: 0, outOfStockCount: 0, totalValue: 0, totalCategories: 0 };

    const [totalProducts, lowStockCount, outOfStockCount, totalCategories, products] = await Promise.all([
      db.product.count({ where: { status: { not: "DISCONTINUED" } } }),
      db.lowStockAlert.count({ where: { isActive: true } }),
      db.product.count({ where: { status: "OUT_OF_STOCK" } }),
      db.category.count(),
      db.product.findMany({
        where: { status: { not: "DISCONTINUED" } },
        select: { quantity: true, purchasePrice: true },
      }),
    ]);

    const totalValue = products.reduce(
      (sum, p) => sum + p.quantity * Number(p.purchasePrice),
      0
    );

    return { totalProducts, lowStockCount, outOfStockCount, totalValue, totalCategories };
  } catch {
    return { totalProducts: 0, lowStockCount: 0, outOfStockCount: 0, totalValue: 0, totalCategories: 0 };
  }
}

export async function getLowStockProducts() {
  try {
    const { error } = await requireInventoryAccess();
    if (error) return [];

    const products = await db.product.findMany({
      where: {
        status: { not: "DISCONTINUED" },
      },
      include: { category: { select: { name: true } } },
      orderBy: { quantity: "asc" },
    });

    return products.filter((p) => p.quantity <= p.reorderLevel);
  } catch {
    return [];
  }
}
