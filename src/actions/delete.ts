"use server";

import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";

type ActionResult = { success: boolean; message: string };

type RelatedData = {
  label: string;
  count: number;
};

export type DeleteCheckResult = {
  canDelete: boolean;
  message: string;
  relatedData: RelatedData[];
  entityName: string;
};

// ─── Check Functions ─────────────────────────────────────

export async function checkCustomerRelatedData(
  customerId: number
): Promise<DeleteCheckResult> {
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    select: {
      name: true,
      _count: { select: { tickets: true, sales: true } },
    },
  });

  if (!customer) {
    return {
      canDelete: false,
      message: "Customer not found",
      relatedData: [],
      entityName: "",
    };
  }

  const relatedData: RelatedData[] = [];
  if (customer._count.tickets > 0)
    relatedData.push({ label: "Tickets", count: customer._count.tickets });
  if (customer._count.sales > 0)
    relatedData.push({ label: "Sales", count: customer._count.sales });

  return {
    canDelete: true,
    message:
      relatedData.length > 0
        ? `Deleting "${customer.name}" will also permanently delete all related records.`
        : `Are you sure you want to delete "${customer.name}"?`,
    relatedData,
    entityName: customer.name,
  };
}

export async function checkProductRelatedData(
  productId: string
): Promise<DeleteCheckResult> {
  const product = await db.product.findUnique({
    where: { id: productId },
    select: {
      name: true,
      _count: { select: { saleItems: true, stockMovements: true, lowStockAlerts: true } },
    },
  });

  if (!product) {
    return {
      canDelete: false,
      message: "Product not found",
      relatedData: [],
      entityName: "",
    };
  }

  const relatedData: RelatedData[] = [];
  if (product._count.saleItems > 0)
    relatedData.push({ label: "Sale Items", count: product._count.saleItems });
  if (product._count.stockMovements > 0)
    relatedData.push({
      label: "Stock Movements",
      count: product._count.stockMovements,
    });
  if (product._count.lowStockAlerts > 0)
    relatedData.push({
      label: "Stock Alerts",
      count: product._count.lowStockAlerts,
    });

  return {
    canDelete: true,
    message:
      relatedData.length > 0
        ? `Deleting "${product.name}" will also permanently delete all related records.`
        : `Are you sure you want to delete "${product.name}"?`,
    relatedData,
    entityName: product.name,
  };
}

export async function checkUserRelatedData(
  userId: string
): Promise<DeleteCheckResult> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      role: true,
      _count: {
        select: {
          customers: true,
          assignedTickets: true,
          createdTickets: true,
          statusUpdates: true,
          paymentRecords: true,
          productsCreated: true,
          stockMovements: true,
          categoriesCreated: true,
          salesCreated: true,
          salePayments: true,
        },
      },
    },
  });

  if (!user) {
    return {
      canDelete: false,
      message: "User not found",
      relatedData: [],
      entityName: "",
    };
  }

  // Check if last admin
  if (user.role === "ADMIN") {
    const adminCount = await db.user.count({ where: { role: "ADMIN" } });
    if (adminCount <= 1) {
      return {
        canDelete: false,
        message: "Cannot delete the last admin user",
        relatedData: [],
        entityName: user.username,
      };
    }
  }

  const relatedData: RelatedData[] = [];
  if (user._count.customers > 0)
    relatedData.push({ label: "Customers Created", count: user._count.customers });
  if (user._count.assignedTickets > 0)
    relatedData.push({
      label: "Assigned Tickets",
      count: user._count.assignedTickets,
    });
  if (user._count.createdTickets > 0)
    relatedData.push({
      label: "Created Tickets",
      count: user._count.createdTickets,
    });
  if (user._count.salesCreated > 0)
    relatedData.push({ label: "Sales Created", count: user._count.salesCreated });
  if (user._count.productsCreated > 0)
    relatedData.push({
      label: "Products Created",
      count: user._count.productsCreated,
    });
  if (user._count.categoriesCreated > 0)
    relatedData.push({
      label: "Categories Created",
      count: user._count.categoriesCreated,
    });
  if (user._count.stockMovements > 0)
    relatedData.push({
      label: "Stock Movements",
      count: user._count.stockMovements,
    });
  if (user._count.paymentRecords > 0)
    relatedData.push({
      label: "Payment Records",
      count: user._count.paymentRecords,
    });
  if (user._count.salePayments > 0)
    relatedData.push({
      label: "Sale Payments",
      count: user._count.salePayments,
    });

  return {
    canDelete: true,
    message:
      relatedData.length > 0
        ? `Deleting "${user.username}" will also permanently delete all related records.`
        : `Are you sure you want to delete "${user.username}"?`,
    relatedData,
    entityName: user.username,
  };
}

export async function checkTicketRelatedData(
  ticketId: string
): Promise<DeleteCheckResult> {
  const ticket = await db.ticket.findUnique({
    where: { id: ticketId },
    select: {
      ticketNumber: true,
      customer: { select: { name: true } },
      _count: { select: { statusHistory: true, paymentHistory: true } },
    },
  });

  if (!ticket) {
    return {
      canDelete: false,
      message: "Ticket not found",
      relatedData: [],
      entityName: "",
    };
  }

  const relatedData: RelatedData[] = [];
  if (ticket._count.statusHistory > 0)
    relatedData.push({
      label: "Status History Records",
      count: ticket._count.statusHistory,
    });
  if (ticket._count.paymentHistory > 0)
    relatedData.push({
      label: "Payment Records",
      count: ticket._count.paymentHistory,
    });

  const displayName = `#${ticket.ticketNumber} (${ticket.customer.name})`;

  return {
    canDelete: true,
    message:
      relatedData.length > 0
        ? `Deleting ticket ${displayName} will also permanently delete all related records.`
        : `Are you sure you want to delete ticket ${displayName}?`,
    relatedData,
    entityName: displayName,
  };
}

export async function checkSaleRelatedData(
  saleId: string
): Promise<DeleteCheckResult> {
  const sale = await db.sale.findUnique({
    where: { id: saleId },
    select: {
      saleNumber: true,
      _count: { select: { items: true, payments: true } },
    },
  });

  if (!sale) {
    return {
      canDelete: false,
      message: "Sale not found",
      relatedData: [],
      entityName: "",
    };
  }

  const relatedData: RelatedData[] = [];
  if (sale._count.items > 0)
    relatedData.push({ label: "Sale Items", count: sale._count.items });
  if (sale._count.payments > 0)
    relatedData.push({ label: "Payments", count: sale._count.payments });

  return {
    canDelete: true,
    message:
      relatedData.length > 0
        ? `Deleting sale "${sale.saleNumber}" will also permanently delete all related records.`
        : `Are you sure you want to delete sale "${sale.saleNumber}"?`,
    relatedData,
    entityName: sale.saleNumber,
  };
}

// ─── Cascade Delete Functions ────────────────────────────

export async function cascadeDeleteCustomer(
  customerId: number
): Promise<ActionResult> {
  try {
    const user = await getCurrentDbUser();
    if (!user) return { success: false, message: "Not authenticated" };
    if (user.role !== "ADMIN")
      return { success: false, message: "Only admins can delete customers" };

    const customer = await db.customer.findUnique({
      where: { id: customerId },
    });
    if (!customer) return { success: false, message: "Customer not found" };

    await db.customer.delete({ where: { id: customerId } });

    revalidatePath("/admin/customers");
    revalidatePath("/cashier/customers");
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/tickets");
    revalidatePath("/admin/sales");
    return { success: true, message: "Customer and all related records deleted successfully" };
  } catch (error) {
    console.error("Cascade delete customer error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function cascadeDeleteProduct(
  productId: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentDbUser();
    if (!user || user.role !== "ADMIN")
      return { success: false, message: "Only admins can delete products" };

    const product = await db.product.findUnique({ where: { id: productId } });
    if (!product) return { success: false, message: "Product not found" };

    await db.product.delete({ where: { id: productId } });

    revalidatePath("/admin/inventory");
    revalidatePath("/cashier/inventory");
    revalidatePath("/admin/sales");
    return { success: true, message: "Product and all related records deleted successfully" };
  } catch (error) {
    console.error("Cascade delete product error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function cascadeDeleteUser(
  userId: string
): Promise<ActionResult> {
  try {
    const currentUser = await getCurrentDbUser();
    if (!currentUser || currentUser.role !== "ADMIN")
      return { success: false, message: "Only admins can delete users" };

    const targetUser = await db.user.findUnique({ where: { id: userId } });
    if (!targetUser) return { success: false, message: "User not found" };

    if (targetUser.id === currentUser.id)
      return { success: false, message: "You cannot delete your own account" };

    if (targetUser.role === "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1)
        return { success: false, message: "Cannot delete the last admin user" };
    }

    // Delete from Clerk first
    const clerk = await clerkClient();
    try {
      await clerk.users.deleteUser(targetUser.clerkId);
    } catch (error) {
      console.error("Failed to delete Clerk user:", error);
      return {
        success: false,
        message: "Failed to remove user from authentication system",
      };
    }

    await db.user.delete({ where: { id: userId } });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/users");
    revalidatePath("/admin/tickets");
    revalidatePath("/admin/sales");
    revalidatePath("/admin/inventory");
    return { success: true, message: "User and all related records deleted successfully" };
  } catch (error) {
    console.error("Cascade delete user error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function cascadeDeleteTicket(
  ticketId: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentDbUser();
    if (!user) return { success: false, message: "Not authenticated" };
    if (user.role !== "ADMIN")
      return { success: false, message: "Only admins can delete tickets" };

    const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return { success: false, message: "Ticket not found" };

    await db.ticket.delete({ where: { id: ticketId } });

    revalidatePath("/admin/tickets");
    revalidatePath("/admin/dashboard");
    revalidatePath("/technician/dashboard");
    return { success: true, message: "Ticket and all related records deleted successfully" };
  } catch (error) {
    console.error("Cascade delete ticket error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function cascadeDeleteSale(
  saleId: string
): Promise<ActionResult> {
  try {
    const user = await getCurrentDbUser();
    if (!user) return { success: false, message: "Not authenticated" };
    if (user.role !== "ADMIN")
      return { success: false, message: "Only admins can delete sales" };

    const sale = await db.sale.findUnique({ where: { id: saleId } });
    if (!sale) return { success: false, message: "Sale not found" };

    await db.sale.delete({ where: { id: saleId } });

    revalidatePath("/admin/sales");
    revalidatePath("/cashier/sales");
    revalidatePath("/admin/dashboard");
    return { success: true, message: "Sale and all related records deleted successfully" };
  } catch (error) {
    console.error("Cascade delete sale error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}
