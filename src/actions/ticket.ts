"use server";

import {
  createTicketSchema,
  diagnosticsSchema,
  paymentSchema,
} from "@/lib/validations";
import { STANDARD_DIAGNOSTIC_FEE } from "@/lib/ticket-constants";
import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { TicketStatus, PaymentStatus, Prisma } from "@prisma/client";

export type ActionResult = {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
};

// ─── Access Helpers ──────────────────────────────────────────

async function requireTicketAccess() {
  const user = await getCurrentDbUser();
  if (!user) return { error: "Not authenticated", user: null };
  if (user.role === "TECHNICIAN")
    return { error: "You do not have permission for this action", user: null };
  return { error: null, user };
}

async function requireAuth() {
  const user = await getCurrentDbUser();
  if (!user) return { error: "Not authenticated", user: null };
  return { error: null, user };
}

// ─── Ticket Number Generator ─────────────────────────────────

async function generateTicketNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `TKT-${year}`;
  const count = await db.ticket.count({
    where: { ticketNumber: { startsWith: prefix } },
  });
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}

// ─── CRUD ────────────────────────────────────────────────────

export async function createTicket(
  formData: FormData
): Promise<ActionResult> {
  try {
    const { error, user } = await requireTicketAccess();
    if (error || !user)
      return { success: false, message: error || "Not authenticated" };

    const rawData = {
      customerId: Number(formData.get("customerId")),
      deviceType: formData.get("deviceType") as string,
      brand: formData.get("brand") as string,
      serialNumber: (formData.get("serialNumber") as string) || "",
      issueDescription: formData.get("issueDescription") as string,
      assignedToId: formData.get("assignedToId") as string,
      priority: formData.get("priority") as string,
      expectedReturnDate: (formData.get("expectedReturnDate") as string) || "",
      deliveryMethod: formData.get("deliveryMethod") as string,
      deliveryAddress: (formData.get("deliveryAddress") as string) || "",
      deliveryFee: Number(formData.get("deliveryFee") || 0),
    };

    const validation = createTicketSchema.safeParse(rawData);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError =
        Object.values(errors)[0]?.[0] ?? "Validation failed";
      return { success: false, message: firstError };
    }

    const d = validation.data;

    // Check customer exists and get VIP status
    const customer = await db.customer.findUnique({
      where: { id: d.customerId },
      select: { isVIP: true, name: true },
    });
    if (!customer)
      return { success: false, message: "Customer not found" };

    // Calculate diagnostic fee
    const diagnosticFee = customer.isVIP ? 0 : STANDARD_DIAGNOSTIC_FEE;

    // Generate ticket number
    const ticketNumber = await generateTicketNumber();

    const ticket = await db.ticket.create({
      data: {
        ticketNumber,
        customerId: d.customerId,
        deviceType: d.deviceType,
        brand: d.brand,
        serialNumber: d.serialNumber || null,
        issueDescription: d.issueDescription,
        assignedToId: d.assignedToId,
        priority: d.priority as Prisma.EnumPriorityFilter["equals"],
        expectedReturnDate: d.expectedReturnDate
          ? new Date(d.expectedReturnDate)
          : null,
        deliveryMethod:
          d.deliveryMethod as Prisma.EnumDeliveryMethodFilter["equals"],
        deliveryAddress: d.deliveryAddress || null,
        deliveryFee: d.deliveryFee,
        diagnosticFee,
        totalAmount: diagnosticFee + d.deliveryFee,
        createdById: user.id,
        statusHistory: {
          create: {
            status: "PENDING",
            notes: "Ticket created",
            updatedById: user.id,
          },
        },
      },
    });

    revalidatePath("/admin/tickets");
    revalidatePath("/cashier/tickets");
    revalidatePath("/technician/my-tickets");
    return {
      success: true,
      message: `Ticket ${ticketNumber} created successfully`,
      data: { id: ticket.id, ticketNumber },
    };
  } catch (err) {
    console.error("Create ticket error:", err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function getTickets(params?: {
  search?: string;
  status?: string;
  assignedToId?: string;
  page?: number;
  limit?: number;
}) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return { tickets: [], total: 0 };

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const skip = (page - 1) * limit;
    const search = params?.search?.trim();

    // Technicians can only see their own tickets
    const where: Prisma.TicketWhereInput = {};
    if (user.role === "TECHNICIAN") {
      where.assignedToId = user.id;
    }

    if (params?.status && params.status !== "ALL") {
      where.status = params.status as TicketStatus;
    }

    if (params?.assignedToId) {
      where.assignedToId = params.assignedToId;
    }

    if (search) {
      where.OR = [
        { ticketNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search } } },
        { brand: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tickets, total] = await Promise.all([
      db.ticket.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, phone: true, isVIP: true } },
          assignedTo: { select: { id: true, username: true } },
          createdBy: { select: { username: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      db.ticket.count({ where }),
    ]);

    return { tickets, total };
  } catch {
    return { tickets: [], total: 0 };
  }
}

export async function getTicketById(ticketId: string) {
  try {
    const { error, user } = await requireAuth();
    if (error || !user) return null;

    const ticket = await db.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
        assignedTo: { select: { id: true, username: true, phone: true } },
        createdBy: { select: { username: true } },
        statusHistory: {
          include: { updatedBy: { select: { username: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!ticket) return null;

    // Technicians can only view their own tickets
    if (user.role === "TECHNICIAN" && ticket.assignedToId !== user.id) {
      return null;
    }

    return ticket;
  } catch {
    return null;
  }
}

export async function deleteTicket(ticketId: string): Promise<ActionResult> {
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
    return { success: true, message: "Ticket deleted successfully" };
  } catch (err) {
    console.error("Delete ticket error:", err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// ─── Diagnostics ─────────────────────────────────────────────

export async function submitDiagnostics(
  ticketId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { error, user } = await requireAuth();
    if (error || !user)
      return { success: false, message: error || "Not authenticated" };

    const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return { success: false, message: "Ticket not found" };

    // Only assigned technician or admin can submit diagnostics
    if (user.role === "TECHNICIAN" && ticket.assignedToId !== user.id) {
      return {
        success: false,
        message: "You can only update diagnostics for your own tickets",
      };
    }

    if (
      user.role === "TECHNICIAN" &&
      ticket.status !== "IN_DIAGNOSTICS" &&
      ticket.status !== "PENDING"
    ) {
      return {
        success: false,
        message: "Ticket is not in diagnostic phase",
      };
    }

    const rawData = {
      diagnosticFindings: formData.get("diagnosticFindings") as string,
      requiredParts: (formData.get("requiredParts") as string) || "",
      laborCost: Number(formData.get("laborCost") || 0),
      partsCost: Number(formData.get("partsCost") || 0),
    };

    const validation = diagnosticsSchema.safeParse(rawData);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError =
        Object.values(errors)[0]?.[0] ?? "Validation failed";
      return { success: false, message: firstError };
    }

    const d = validation.data;
    const estimatedCost = d.laborCost + d.partsCost;

    await db.ticket.update({
      where: { id: ticketId },
      data: {
        diagnosticFindings: d.diagnosticFindings,
        requiredParts: d.requiredParts || null,
        laborCost: d.laborCost,
        partsCost: d.partsCost,
        estimatedCost,
        status: "AWAITING_APPROVAL",
        statusHistory: {
          create: {
            status: "AWAITING_APPROVAL",
            notes: `Diagnostics completed. Estimated cost: ${estimatedCost}`,
            updatedById: user.id,
          },
        },
      },
    });

    revalidatePath("/admin/tickets");
    revalidatePath("/cashier/tickets");
    revalidatePath("/technician/my-tickets");
    return { success: true, message: "Diagnostics submitted successfully" };
  } catch (err) {
    console.error("Submit diagnostics error:", err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// ─── Status Updates ──────────────────────────────────────────

export async function updateTicketStatus(
  ticketId: string,
  newStatus: string,
  notes?: string
): Promise<ActionResult> {
  try {
    const { error, user } = await requireAuth();
    if (error || !user)
      return { success: false, message: error || "Not authenticated" };

    const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return { success: false, message: "Ticket not found" };

    // Technician can only update own tickets
    if (user.role === "TECHNICIAN" && ticket.assignedToId !== user.id) {
      return { success: false, message: "Not authorized" };
    }

    const updateData: Prisma.TicketUpdateInput = {
      status: newStatus as TicketStatus,
      statusHistory: {
        create: {
          status: newStatus as TicketStatus,
          notes: notes || null,
          updatedById: user.id,
        },
      },
    };

    // Set completedAt when status becomes COMPLETED
    if (newStatus === "COMPLETED" || newStatus === "DELIVERED") {
      updateData.completedAt = new Date();
    }

    // Calculate total when completing
    if (newStatus === "COMPLETED" || newStatus === "READY_FOR_PICKUP" || newStatus === "OUT_FOR_DELIVERY") {
      const finalCost = ticket.finalCost || ticket.estimatedCost || new Prisma.Decimal(0);
      const totalAmount =
        Number(ticket.diagnosticFee) +
        Number(finalCost) +
        Number(ticket.deliveryFee);
      updateData.totalAmount = totalAmount;
      if (!ticket.finalCost && ticket.estimatedCost) {
        updateData.finalCost = ticket.estimatedCost;
      }
    }

    await db.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    revalidatePath("/admin/tickets");
    revalidatePath("/cashier/tickets");
    revalidatePath("/technician/my-tickets");
    return { success: true, message: `Status updated to ${newStatus}` };
  } catch (err) {
    console.error("Update status error:", err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function markDiagnosticPaid(
  ticketId: string
): Promise<ActionResult> {
  try {
    const { error, user } = await requireTicketAccess();
    if (error || !user)
      return { success: false, message: error || "Not authenticated" };

    const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return { success: false, message: "Ticket not found" };

    await db.ticket.update({
      where: { id: ticketId },
      data: {
        diagnosticPaid: true,
        status: "IN_DIAGNOSTICS",
        amountPaid: { increment: ticket.diagnosticFee },
        statusHistory: {
          create: {
            status: "IN_DIAGNOSTICS",
            notes: "Diagnostic fee paid. Sent to diagnostics.",
            updatedById: user.id,
          },
        },
      },
    });

    revalidatePath("/admin/tickets");
    revalidatePath("/cashier/tickets");
    revalidatePath("/technician/my-tickets");
    return { success: true, message: "Diagnostic fee marked as paid" };
  } catch (err) {
    console.error("Mark diagnostic paid error:", err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// ─── Payment ─────────────────────────────────────────────────

export async function recordPayment(
  ticketId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { error, user } = await requireTicketAccess();
    if (error || !user)
      return { success: false, message: error || "Not authenticated" };

    const rawData = {
      amountPaid: Number(formData.get("amountPaid") || 0),
      paymentMethod: formData.get("paymentMethod") as string,
    };

    const validation = paymentSchema.safeParse(rawData);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError =
        Object.values(errors)[0]?.[0] ?? "Validation failed";
      return { success: false, message: firstError };
    }

    const ticket = await db.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) return { success: false, message: "Ticket not found" };

    const newAmountPaid =
      Number(ticket.amountPaid) + validation.data.amountPaid;
    const totalAmount = Number(ticket.totalAmount);

    let paymentStatus: PaymentStatus = "PARTIALLY_PAID";
    if (newAmountPaid >= totalAmount) {
      paymentStatus = "PAID";
    } else if (newAmountPaid <= 0) {
      paymentStatus = "UNPAID";
    }

    await db.ticket.update({
      where: { id: ticketId },
      data: {
        amountPaid: newAmountPaid,
        paymentStatus,
        paymentMethod: validation.data.paymentMethod,
        statusHistory: {
          create: {
            status: ticket.status,
            notes: `Payment of ${validation.data.amountPaid} recorded via ${validation.data.paymentMethod}`,
            updatedById: user.id,
          },
        },
      },
    });

    revalidatePath("/admin/tickets");
    revalidatePath("/cashier/tickets");
    return { success: true, message: "Payment recorded successfully" };
  } catch (err) {
    console.error("Record payment error:", err);
    return { success: false, message: "An unexpected error occurred" };
  }
}

// ─── Stats ───────────────────────────────────────────────────

export async function getTicketStats(role?: string, userId?: string) {
  try {
    const user = await getCurrentDbUser();
    if (!user) return null;

    const where: Prisma.TicketWhereInput = {};
    if (user.role === "TECHNICIAN") {
      where.assignedToId = user.id;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      total,
      pending,
      inProgress,
      completedToday,
      completedThisWeek,
    ] = await Promise.all([
      db.ticket.count({ where }),
      db.ticket.count({
        where: { ...where, status: { in: ["PENDING", "IN_DIAGNOSTICS", "AWAITING_APPROVAL"] } },
      }),
      db.ticket.count({
        where: { ...where, status: { in: ["APPROVED", "IN_PROGRESS", "WAITING_FOR_PARTS"] } },
      }),
      db.ticket.count({
        where: {
          ...where,
          status: { in: ["COMPLETED", "READY_FOR_PICKUP", "DELIVERED"] },
          completedAt: { gte: today },
        },
      }),
      db.ticket.count({
        where: {
          ...where,
          status: { in: ["COMPLETED", "READY_FOR_PICKUP", "DELIVERED"] },
          completedAt: { gte: weekAgo },
        },
      }),
    ]);

    // Revenue this month (for admin/cashier)
    let revenueThisMonth = 0;
    if (user.role !== "TECHNICIAN") {
      const result = await db.ticket.aggregate({
        where: {
          paymentStatus: { in: ["PAID", "PARTIALLY_PAID"] },
          updatedAt: { gte: monthStart },
        },
        _sum: { amountPaid: true },
      });
      revenueThisMonth = Number(result._sum.amountPaid || 0);
    }

    return {
      total,
      pending,
      inProgress,
      completedToday,
      completedThisWeek,
      revenueThisMonth,
    };
  } catch {
    return null;
  }
}

// ─── Helper Queries ──────────────────────────────────────────

export async function getTechnicians() {
  try {
    const technicians = await db.user.findMany({
      where: { role: "TECHNICIAN" },
      select: { id: true, username: true },
      orderBy: { username: "asc" },
    });
    return technicians;
  } catch {
    return [];
  }
}

export async function searchCustomers(search: string) {
  try {
    if (!search || search.length < 2) return [];
    const customers = await db.customer.findMany({
      where: {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      },
      select: { id: true, name: true, phone: true, isVIP: true },
      take: 10,
      orderBy: { name: "asc" },
    });
    return customers;
  } catch {
    return [];
  }
}
