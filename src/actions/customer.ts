"use server";

import { createCustomerSchema, updateCustomerSchema } from "@/lib/validations";
import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ActionResult = {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
};

/** Only ADMIN and CASHIER can access customer operations */
async function requireCustomerAccess() {
  const user = await getCurrentDbUser();
  if (!user) {
    return { error: "Not authenticated", user: null };
  }
  if (user.role === "TECHNICIAN") {
    return { error: "You do not have permission to manage customers", user: null };
  }
  return { error: null, user };
}

export async function createCustomer(formData: FormData): Promise<ActionResult> {
  try {
    const { error, user } = await requireCustomerAccess();
    if (error || !user) {
      return { success: false, message: error || "Not authenticated" };
    }

    const rawData = {
      name: (formData.get("name") as string)?.trim(),
      phone: (formData.get("phone") as string)?.trim(),
      address: (formData.get("address") as string)?.trim(),
      isVIP: formData.get("isVIP") === "true",
    };

    const validation = createCustomerSchema.safeParse(rawData);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] ?? "Validation failed";
      return { success: false, message: firstError };
    }

    // Check for duplicate phone
    const existing = await db.customer.findUnique({
      where: { phone: validation.data.phone },
    });
    if (existing) {
      return { success: false, message: "A customer with this phone number already exists" };
    }

    const newCustomer = await db.customer.create({
      data: {
        name: validation.data.name,
        phone: validation.data.phone,
        address: validation.data.address,
        isVIP: validation.data.isVIP,
        createdById: user.id,
      },
    });

    revalidatePath("/admin/customers");
    revalidatePath("/cashier/customers");
    revalidatePath("/admin/dashboard");
    return {
      success: true,
      message: `Customer "${validation.data.name}" created successfully`,
      data: {
        id: newCustomer.id,
        name: newCustomer.name,
        phone: newCustomer.phone,
        isVIP: newCustomer.isVIP,
      },
    };
  } catch (error) {
    console.error("Create customer error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function updateCustomer(
  customerId: number,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { error, user } = await requireCustomerAccess();
    if (error || !user) {
      return { success: false, message: error || "Not authenticated" };
    }

    const customer = await db.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return { success: false, message: "Customer not found" };
    }

    const rawData = {
      name: (formData.get("name") as string)?.trim(),
      phone: (formData.get("phone") as string)?.trim(),
      address: (formData.get("address") as string)?.trim(),
      isVIP: formData.get("isVIP") === "true",
    };

    const validation = updateCustomerSchema.safeParse(rawData);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] ?? "Validation failed";
      return { success: false, message: firstError };
    }

    // Check for duplicate phone (exclude current customer)
    if (validation.data.phone !== customer.phone) {
      const existing = await db.customer.findUnique({
        where: { phone: validation.data.phone },
      });
      if (existing) {
        return { success: false, message: "A customer with this phone number already exists" };
      }
    }

    await db.customer.update({
      where: { id: customerId },
      data: {
        name: validation.data.name,
        phone: validation.data.phone,
        address: validation.data.address,
        isVIP: validation.data.isVIP,
      },
    });

    revalidatePath("/admin/customers");
    revalidatePath("/cashier/customers");
    return { success: true, message: "Customer updated successfully" };
  } catch (error) {
    console.error("Update customer error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function deleteCustomer(customerId: number): Promise<ActionResult> {
  try {
    const user = await getCurrentDbUser();
    if (!user) {
      return { success: false, message: "Not authenticated" };
    }
    if (user.role !== "ADMIN") {
      return { success: false, message: "Only admins can delete customers" };
    }

    const customer = await db.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return { success: false, message: "Customer not found" };
    }

    await db.customer.delete({ where: { id: customerId } });

    revalidatePath("/admin/customers");
    revalidatePath("/cashier/customers");
    revalidatePath("/admin/dashboard");
    return { success: true, message: "Customer deleted successfully" };
  } catch (error) {
    console.error("Delete customer error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function getCustomers(params?: {
  search?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { error } = await requireCustomerAccess();
    if (error) return { customers: [], total: 0 };

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const skip = (page - 1) * limit;
    const search = params?.search?.trim();

    const where = search
      ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search } },
        ],
      }
      : {};

    const [customers, total] = await Promise.all([
      db.customer.findMany({
        where,
        include: {
          createdBy: {
            select: { username: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.customer.count({ where }),
    ]);

    return { customers, total };
  } catch {
    return { customers: [], total: 0 };
  }
}

export async function getCustomerStats() {
  try {
    const { error } = await requireCustomerAccess();
    if (error) return { total: 0, vip: 0, regular: 0 };

    const [total, vip] = await Promise.all([
      db.customer.count(),
      db.customer.count({ where: { isVIP: true } }),
    ]);

    return { total, vip, regular: total - vip };
  } catch {
    return { total: 0, vip: 0, regular: 0 };
  }
}
