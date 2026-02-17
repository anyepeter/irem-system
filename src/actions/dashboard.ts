"use server";

import { db } from "@/lib/db";
import { getCurrentDbUser } from "@/lib/auth";

// ─── Helpers ──────────────────────────────────────────────

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfYesterday() {
  const d = startOfToday();
  d.setDate(d.getDate() - 1);
  return d;
}

function startOfMonth() {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfLastMonth() {
  const d = startOfMonth();
  d.setMonth(d.getMonth() - 1);
  return d;
}

function toNumber(v: unknown): number {
  if (v === null || v === undefined) return 0;
  return Number(v);
}

// ─── ADMIN: Financial Stats ───────────────────────────────

export async function getAdminFinancialStats() {
  const thisMonth = startOfMonth();
  const lastMonth = startOfLastMonth();

  const [salesProfitResult, ticketProfitResult, combinedRevResult, lastMonthProfitResult] =
    await Promise.all([
      // Sales profit: sum of SaleItem.profit for PAID/COMPLETED sales
      db.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(si.profit), 0)::float as total
        FROM "SaleItem" si
        JOIN "Sale" s ON si."saleId" = s.id
        WHERE s.status IN ('PAID', 'COMPLETED')
      `,
      // Ticket profit: finalCost - partsCost for COMPLETED tickets
      db.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(COALESCE("finalCost", 0) - COALESCE("partsCost", 0)), 0)::float as total
        FROM "Ticket"
        WHERE status = 'COMPLETED'
      `,
      // Combined revenue: sales amountPaid + ticket amountPaid
      db.$queryRaw<[{ sales: number; tickets: number }]>`
        SELECT
          (SELECT COALESCE(SUM("amountPaid"), 0)::float FROM "Sale" WHERE status != 'CANCELLED') as sales,
          (SELECT COALESCE(SUM("amountPaid"), 0)::float FROM "Ticket") as tickets
      `,
      // Last month profit for comparison
      db.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(si.profit), 0)::float as total
        FROM "SaleItem" si
        JOIN "Sale" s ON si."saleId" = s.id
        WHERE s.status IN ('PAID', 'COMPLETED')
        AND s."createdAt" >= ${lastMonth} AND s."createdAt" < ${thisMonth}
      `,
    ]);

  const salesProfit = toNumber(salesProfitResult[0]?.total);
  const ticketProfit = toNumber(ticketProfitResult[0]?.total);
  const totalProfit = salesProfit + ticketProfit;
  const combinedRevenue = toNumber(combinedRevResult[0]?.sales) + toNumber(combinedRevResult[0]?.tickets);
  const lastMonthProfit = toNumber(lastMonthProfitResult[0]?.total);

  // This month's profit
  const thisMonthProfitResult = await db.$queryRaw<[{ total: number }]>`
    SELECT COALESCE(SUM(si.profit), 0)::float as total
    FROM "SaleItem" si
    JOIN "Sale" s ON si."saleId" = s.id
    WHERE s.status IN ('PAID', 'COMPLETED')
    AND s."createdAt" >= ${thisMonth}
  `;
  const thisMonthProfit = toNumber(thisMonthProfitResult[0]?.total);
  const profitChangePercent = lastMonthProfit > 0
    ? Math.round(((thisMonthProfit - lastMonthProfit) / lastMonthProfit) * 100)
    : 0;

  return { totalProfit, salesProfit, ticketProfit, combinedRevenue, profitChangePercent };
}

// ─── ADMIN: Today's Activity ──────────────────────────────

export async function getAdminTodayStats() {
  const today = startOfToday();
  const yesterday = startOfYesterday();

  const [salesToday, salesRevenueToday, ticketsToday, ticketsCompletedToday, pendingToday, yesterdayRevenue] =
    await Promise.all([
      db.sale.count({ where: { createdAt: { gte: today }, status: { not: "CANCELLED" } } }),
      db.sale.aggregate({ where: { createdAt: { gte: today }, status: { not: "CANCELLED" } }, _sum: { amountPaid: true } }),
      db.ticket.count({ where: { createdAt: { gte: today } } }),
      db.ticket.count({ where: { completedAt: { gte: today } } }),
      db.sale.count({ where: { createdAt: { gte: today }, status: "PENDING" } }) ,
      db.sale.aggregate({
        where: { createdAt: { gte: yesterday, lt: today }, status: { not: "CANCELLED" } },
        _sum: { amountPaid: true },
      }),
    ]);

  const revenueToday = toNumber(salesRevenueToday._sum.amountPaid);
  const revenueYesterday = toNumber(yesterdayRevenue._sum.amountPaid);

  return {
    salesToday,
    salesRevenueToday: revenueToday,
    ticketsToday,
    ticketsCompletedToday,
    revenueToday,
    pendingToday,
    revenueVsYesterday: revenueYesterday,
  };
}

// ─── ADMIN: System Counts ─────────────────────────────────

export async function getAdminSystemCounts() {
  const today = startOfToday();

  const [
    totalCustomers, customersToday,
    totalTickets, ticketsToday,
    totalProducts, productsInStock,
    totalSales, salesToday,
    totalUsers,
    stockAlerts,
  ] = await Promise.all([
    db.customer.count(),
    db.customer.count({ where: { createdAt: { gte: today } } }),
    db.ticket.count(),
    db.ticket.count({ where: { createdAt: { gte: today } } }),
    db.product.count(),
    db.product.count({ where: { quantity: { gt: 0 } } }),
    db.sale.count({ where: { status: { not: "CANCELLED" } } }),
    db.sale.count({ where: { createdAt: { gte: today }, status: { not: "CANCELLED" } } }),
    db.user.count(),
    db.product.count({
      where: {
        OR: [
          { quantity: 0 },
          { quantity: { lte: db.product.fields.reorderLevel as unknown as number } },
        ],
      },
    }).catch(() => 0),
  ]);

  // Stock alerts with raw query for self-referencing comparison
  const alertCount = await db.$queryRaw<[{ count: number }]>`
    SELECT COUNT(*)::int as count FROM "Product" WHERE quantity <= "reorderLevel" AND status = 'ACTIVE'
  `;

  return {
    totalCustomers, customersToday,
    totalTickets, ticketsToday,
    totalProducts, productsInStock,
    totalSales, salesToday,
    totalUsers,
    stockAlerts: toNumber(alertCount[0]?.count),
  };
}

// ─── ADMIN: Revenue Chart Data (Last N months) ────────────

export async function getRevenueChartData(months: number = 6) {
  const data = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const monthName = start.toLocaleString("default", { month: "short" });

    const [salesRev, ticketRev] = await Promise.all([
      db.sale.aggregate({
        where: { createdAt: { gte: start, lt: end }, status: { not: "CANCELLED" } },
        _sum: { amountPaid: true },
      }),
      db.ticket.aggregate({
        where: { createdAt: { gte: start, lt: end } },
        _sum: { amountPaid: true },
      }),
    ]);

    data.push({
      month: monthName,
      salesRevenue: toNumber(salesRev._sum.amountPaid),
      ticketRevenue: toNumber(ticketRev._sum.amountPaid),
    });
  }
  return data;
}

// ─── ADMIN: Daily Sales Chart (Last N days) ───────────────

export async function getDailySalesChartData(days: number = 7) {
  const data = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(now.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const dayName = start.toLocaleString("default", { weekday: "short" });

    const [salesRev, ticketRev] = await Promise.all([
      db.sale.aggregate({
        where: { createdAt: { gte: start, lt: end }, status: { not: "CANCELLED" } },
        _sum: { amountPaid: true },
      }),
      db.ticket.aggregate({
        where: { createdAt: { gte: start, lt: end } },
        _sum: { amountPaid: true },
      }),
    ]);

    data.push({
      day: dayName,
      sales: toNumber(salesRev._sum.amountPaid),
      tickets: toNumber(ticketRev._sum.amountPaid),
    });
  }
  return data;
}

// ─── ADMIN: Ticket Status Chart ───────────────────────────

export async function getTicketStatusChartData() {
  const statuses = ["PENDING", "IN_DIAGNOSTICS", "IN_PROGRESS", "COMPLETED", "CANCELLED"] as const;
  const data = await Promise.all(
    statuses.map(async (status) => ({
      status,
      count: await db.ticket.count({ where: { status } }),
    }))
  );
  return data;
}

// ─── ADMIN: Payment Method Chart ──────────────────────────

export async function getPaymentMethodChartData() {
  const thisMonth = startOfMonth();
  const result = await db.salePayment.groupBy({
    by: ["paymentMethod"],
    where: { createdAt: { gte: thisMonth } },
    _sum: { amount: true },
  });

  const labels: Record<string, string> = {
    CASH: "Cash",
    MOBILE_MONEY_MTN: "MTN MoMo",
    MOBILE_MONEY_ORANGE: "Orange Money",
    BANK_TRANSFER: "Bank Transfer",
    CREDIT: "Credit",
  };

  return result.map((r) => ({
    name: labels[r.paymentMethod] || r.paymentMethod,
    value: toNumber(r._sum.amount),
  }));
}

// ─── ADMIN: Stock Alerts ──────────────────────────────────

export async function getStockAlerts(limit: number = 8) {
  const products = await db.$queryRaw<Array<{
    id: string;
    name: string;
    sku: string;
    quantity: number;
    reorderLevel: number;
  }>>`
    SELECT id, name, sku, quantity, "reorderLevel"
    FROM "Product"
    WHERE quantity <= "reorderLevel" AND status = 'ACTIVE'
    ORDER BY quantity ASC
    LIMIT ${limit}
  `;
  return products;
}

// ─── ADMIN: Recent Activity ───────────────────────────────

export async function getRecentActivity(limit: number = 8) {
  const [recentSales, recentTickets, recentCustomers] = await Promise.all([
    db.sale.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        saleNumber: true,
        customerName: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        customer: { select: { name: true } },
      },
    }),
    db.ticket.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      select: {
        id: true,
        ticketNumber: true,
        status: true,
        updatedAt: true,
        customer: { select: { name: true } },
      },
    }),
    db.customer.findMany({
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, name: true, isVIP: true, createdAt: true },
    }),
  ]);

  type ActivityItem = {
    type: "sale" | "ticket" | "customer";
    id: string;
    title: string;
    subtitle: string;
    time: Date;
    status?: string;
  };

  const activities: ActivityItem[] = [
    ...recentSales.map((s) => ({
      type: "sale" as const,
      id: s.id,
      title: `${s.saleNumber} • ${s.customer?.name || s.customerName || "Walk-in"}`,
      subtitle: `${Number(s.totalAmount).toLocaleString()} XAF • ${s.status}`,
      time: s.createdAt,
      status: s.status,
    })),
    ...recentTickets.map((t) => ({
      type: "ticket" as const,
      id: t.id,
      title: `${t.ticketNumber} • ${t.customer.name}`,
      subtitle: t.status.replace(/_/g, " "),
      time: t.updatedAt,
      status: t.status,
    })),
    ...recentCustomers.map((c) => ({
      type: "customer" as const,
      id: String(c.id),
      title: `New Customer • ${c.name}`,
      subtitle: c.isVIP ? "VIP" : "Regular",
      time: c.createdAt,
    })),
  ];

  activities.sort((a, b) => b.time.getTime() - a.time.getTime());
  return activities.slice(0, limit).map((a) => ({
    ...a,
    time: a.time.toISOString(),
  }));
}

// ─── ADMIN: Top Selling Products ──────────────────────────

export async function getTopSellingProducts(limit: number = 5) {
  const thisMonth = startOfMonth();
  const result = await db.saleItem.groupBy({
    by: ["productName"],
    where: {
      sale: { status: { in: ["PAID", "COMPLETED"] }, createdAt: { gte: thisMonth } },
    },
    _sum: { quantity: true, total: true },
    orderBy: { _sum: { total: "desc" } },
    take: limit,
  });

  return result.map((r, i) => ({
    rank: i + 1,
    name: r.productName,
    sold: toNumber(r._sum.quantity),
    revenue: toNumber(r._sum.total),
  }));
}

// ─── ADMIN: Top Technicians ───────────────────────────────

export async function getTopTechnicians(limit: number = 5) {
  const thisMonth = startOfMonth();
  const techs = await db.user.findMany({
    where: { role: "TECHNICIAN" },
    select: {
      id: true,
      username: true,
      assignedTickets: {
        where: { status: "COMPLETED", completedAt: { gte: thisMonth } },
        select: { finalCost: true },
      },
    },
  });

  const ranked = techs
    .map((t) => ({
      id: t.id,
      name: t.username,
      repairs: t.assignedTickets.length,
      revenue: t.assignedTickets.reduce((sum, tk) => sum + toNumber(tk.finalCost), 0),
    }))
    .filter((t) => t.repairs > 0)
    .sort((a, b) => b.repairs - a.repairs)
    .slice(0, limit);

  return ranked.map((t, i) => ({ ...t, rank: i + 1 }));
}

// ─── ADMIN: Outstanding Credit ────────────────────────────

export async function getOutstandingCredit(limit: number = 5) {
  const sales = await db.sale.findMany({
    where: {
      saleType: "CREDIT",
      paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] },
      status: { not: "CANCELLED" },
    },
    orderBy: { amountDue: "desc" },
    take: limit,
    select: {
      id: true,
      saleNumber: true,
      amountDue: true,
      customer: { select: { name: true } },
      customerName: true,
    },
  });

  const totalResult = await db.sale.aggregate({
    where: {
      saleType: "CREDIT",
      paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] },
      status: { not: "CANCELLED" },
    },
    _sum: { amountDue: true },
    _count: true,
  });

  return {
    sales: sales.map((s) => ({
      id: s.id,
      saleNumber: s.saleNumber,
      customerName: s.customer?.name || s.customerName || "Unknown",
      amountDue: toNumber(s.amountDue),
    })),
    totalOutstanding: toNumber(totalResult._sum.amountDue),
    totalCount: totalResult._count,
  };
}

// ─── CASHIER: Today's Stats ───────────────────────────────

export async function getCashierTodayStats() {
  const user = await getCurrentDbUser();
  if (!user) return null;

  const today = startOfToday();
  const yesterday = startOfYesterday();

  const [salesToday, revenueToday, ticketsToday, creditSales, yesterdayCount, yesterdayRevenue] =
    await Promise.all([
      db.sale.count({ where: { createdById: user.id, createdAt: { gte: today }, status: { not: "CANCELLED" } } }),
      db.sale.aggregate({
        where: { createdById: user.id, createdAt: { gte: today }, status: { not: "CANCELLED" } },
        _sum: { amountPaid: true },
      }),
      db.ticket.count({ where: { createdById: user.id, createdAt: { gte: today } } }),
      db.sale.aggregate({
        where: {
          saleType: "CREDIT",
          paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] },
          status: { not: "CANCELLED" },
        },
        _sum: { amountDue: true },
        _count: true,
      }),
      db.sale.count({
        where: { createdById: user.id, createdAt: { gte: yesterday, lt: today }, status: { not: "CANCELLED" } },
      }),
      db.sale.aggregate({
        where: { createdById: user.id, createdAt: { gte: yesterday, lt: today }, status: { not: "CANCELLED" } },
        _sum: { amountPaid: true },
      }),
    ]);

  return {
    salesToday,
    revenueToday: toNumber(revenueToday._sum.amountPaid),
    ticketsToday,
    creditDue: toNumber(creditSales._sum.amountDue),
    creditCount: creditSales._count,
    yesterdaySales: yesterdayCount,
    yesterdayRevenue: toNumber(yesterdayRevenue._sum.amountPaid),
  };
}

// ─── CASHIER: Month Stats ─────────────────────────────────

export async function getCashierMonthStats() {
  const user = await getCurrentDbUser();
  if (!user) return null;

  const thisMonth = startOfMonth();
  const today = startOfToday();

  const [monthData, cashToday, momoToday] = await Promise.all([
    db.sale.aggregate({
      where: { createdById: user.id, createdAt: { gte: thisMonth }, status: { not: "CANCELLED" } },
      _sum: { amountPaid: true },
      _count: true,
    }),
    db.salePayment.aggregate({
      where: { createdById: user.id, createdAt: { gte: today }, paymentMethod: "CASH" },
      _sum: { amount: true },
      _count: true,
    }),
    db.salePayment.aggregate({
      where: {
        createdById: user.id,
        createdAt: { gte: today },
        paymentMethod: { in: ["MOBILE_MONEY_MTN", "MOBILE_MONEY_ORANGE"] },
      },
      _sum: { amount: true },
      _count: true,
    }),
  ]);

  return {
    revenueThisMonth: toNumber(monthData._sum.amountPaid),
    transactionsThisMonth: monthData._count,
    cashToday: toNumber(cashToday._sum.amount),
    cashCount: cashToday._count,
    momoToday: toNumber(momoToday._sum.amount),
    momoCount: momoToday._count,
  };
}

// ─── CASHIER: Hourly Sales Chart ──────────────────────────

export async function getCashierHourlySales() {
  const user = await getCurrentDbUser();
  if (!user) return [];

  const today = startOfToday();
  const data = [];

  for (let h = 8; h <= 20; h++) {
    const start = new Date(today);
    start.setHours(h, 0, 0, 0);
    const end = new Date(today);
    end.setHours(h + 1, 0, 0, 0);

    const result = await db.sale.aggregate({
      where: { createdById: user.id, createdAt: { gte: start, lt: end }, status: { not: "CANCELLED" } },
      _sum: { amountPaid: true },
      _count: true,
    });

    data.push({
      hour: `${h > 12 ? h - 12 : h}${h >= 12 ? "pm" : "am"}`,
      revenue: toNumber(result._sum.amountPaid),
      count: result._count,
    });
  }
  return data;
}

// ─── CASHIER: Weekly Sales Chart ──────────────────────────

export async function getCashierWeeklySales() {
  const user = await getCurrentDbUser();
  if (!user) return [];

  const data = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(now.getDate() - i);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 1);
    const dayName = start.toLocaleString("default", { weekday: "short" });

    const result = await db.sale.aggregate({
      where: { createdById: user.id, createdAt: { gte: start, lt: end }, status: { not: "CANCELLED" } },
      _sum: { amountPaid: true },
    });

    data.push({
      day: dayName,
      revenue: toNumber(result._sum.amountPaid),
    });
  }
  return data;
}

// ─── CASHIER: Payment Breakdown Today ─────────────────────

export async function getCashierPaymentBreakdown() {
  const user = await getCurrentDbUser();
  if (!user) return [];

  const today = startOfToday();
  const result = await db.salePayment.groupBy({
    by: ["paymentMethod"],
    where: { createdById: user.id, createdAt: { gte: today } },
    _sum: { amount: true },
  });

  const labels: Record<string, string> = {
    CASH: "Cash",
    MOBILE_MONEY_MTN: "MTN MoMo",
    MOBILE_MONEY_ORANGE: "Orange Money",
    BANK_TRANSFER: "Bank Transfer",
    CREDIT: "Credit",
  };

  return result.map((r) => ({
    name: labels[r.paymentMethod] || r.paymentMethod,
    value: toNumber(r._sum.amount),
  }));
}

// ─── CASHIER: Recent Sales ────────────────────────────────

export async function getCashierRecentSales(limit: number = 5) {
  const user = await getCurrentDbUser();
  if (!user) return [];

  const today = startOfToday();
  const sales = await db.sale.findMany({
    where: { createdById: user.id, createdAt: { gte: today } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      saleNumber: true,
      customerName: true,
      totalAmount: true,
      paymentStatus: true,
      createdAt: true,
      customer: { select: { name: true } },
    },
  });

  return sales.map((s) => ({
    id: s.id,
    saleNumber: s.saleNumber,
    customerName: s.customer?.name || s.customerName || "Walk-in",
    totalAmount: toNumber(s.totalAmount),
    paymentStatus: s.paymentStatus,
    createdAt: s.createdAt.toISOString(),
  }));
}

// ─── CASHIER: Pending Diagnostic Fees ─────────────────────

export async function getPendingDiagnosticFees(limit: number = 5) {
  const tickets = await db.ticket.findMany({
    where: { diagnosticPaid: false, diagnosticFee: { gt: 0 } },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      ticketNumber: true,
      diagnosticFee: true,
      deviceType: true,
      brand: true,
      customer: { select: { name: true } },
    },
  });

  return tickets.map((t) => ({
    id: t.id,
    ticketNumber: t.ticketNumber,
    customerName: t.customer.name,
    device: `${t.brand} ${t.deviceType}`,
    fee: toNumber(t.diagnosticFee),
  }));
}

// ─── Sales Summary Stats (for sales list page) ───────────

export async function getSalesSummaryStats() {
  const [total, paid, pending, credit, cancelled, revenueResult, profitResult] =
    await Promise.all([
      db.sale.count({ where: { status: { not: "CANCELLED" } } }),
      db.sale.count({ where: { paymentStatus: "PAID" } }),
      db.sale.count({ where: { paymentStatus: { in: ["UNPAID", "PARTIALLY_PAID"] } , status: { not: "CANCELLED" } } }),
      db.sale.count({ where: { saleType: "CREDIT", status: { not: "CANCELLED" } } }),
      db.sale.count({ where: { status: "CANCELLED" } }),
      db.sale.aggregate({ where: { status: { not: "CANCELLED" } }, _sum: { amountPaid: true } }),
      db.$queryRaw<[{ total: number }]>`
        SELECT COALESCE(SUM(si.profit), 0)::float as total
        FROM "SaleItem" si
        JOIN "Sale" s ON si."saleId" = s.id
        WHERE s.status != 'CANCELLED'
      `,
    ]);

  return {
    totalSales: total,
    paidSales: paid,
    pendingSales: pending,
    creditSales: credit,
    cancelledSales: cancelled,
    totalRevenue: toNumber(revenueResult._sum.amountPaid),
    totalProfit: toNumber(profitResult[0]?.total),
  };
}
