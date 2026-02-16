"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sidebar } from "@/components/dashboard/sidebar";
import { getAllPaymentHistory } from "@/actions/ticket";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    Receipt,
    User,
    Clock,
    CreditCard,
    Filter,
    X,
    Calendar,
} from "lucide-react";

type PaymentRecord = {
    id: string;
    ticketId: string;
    amount: unknown;
    paymentMethod: string;
    note: string | null;
    createdAt: string;
    ticket: {
        ticketNumber: string;
        customer: { name: string; phone: string };
    };
    recordedBy: { username: string };
};

type Props = {
    user: {
        username: string;
        avatar: string | null;
        role: "ADMIN" | "CASHIER" | "TECHNICIAN";
    };
    initialPayments: PaymentRecord[];
    initialTotal: number;
    basePath: string;
};

export function PaymentHistoryClient({
    user,
    initialPayments,
    initialTotal,
    basePath,
}: Props) {
    const [payments, setPayments] = useState<PaymentRecord[]>(initialPayments);
    const [total, setTotal] = useState(initialTotal);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [showFilters, setShowFilters] = useState(false);
    const [loading, setLoading] = useState(false);
    const limit = 20;
    const totalPages = Math.ceil(total / limit);

    const fetchPayments = useCallback(
        async (p: number, s: string, df: string, dt: string) => {
            setLoading(true);
            const res = await getAllPaymentHistory({
                page: p,
                limit,
                search: s,
                dateFrom: df,
                dateTo: dt,
            });
            setPayments(JSON.parse(JSON.stringify(res.payments)));
            setTotal(res.total);
            setLoading(false);
        },
        []
    );

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPayments(1, search, dateFrom, dateTo);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [search, dateFrom, dateTo, fetchPayments]);

    const goToPage = (p: number) => {
        setPage(p);
        fetchPayments(p, search, dateFrom, dateTo);
    };

    const clearFilters = () => {
        setSearch("");
        setDateFrom("");
        setDateTo("");
    };

    const hasActiveFilters = search || dateFrom || dateTo;

    // Calculate total revenue from all displayed payments
    const totalRevenue = payments.reduce(
        (sum, p) => sum + Number(p.amount),
        0
    );

    return (
        <div className="flex min-h-screen bg-gray-50">
            <Sidebar role={user.role} username={user.username} />
            <div className="flex-1 overflow-auto">
                <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6"
                    >
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Receipt className="w-6 h-6 text-blue-600" />
                                    Payment History
                                </h1>
                                <p className="text-sm text-gray-500 mt-1">
                                    {total} transaction{total !== 1 ? "s" : ""} recorded
                                </p>
                            </div>

                            {/* Summary Cards */}
                            <div className="flex gap-3">
                                <div className="bg-white rounded-xl px-4 py-2 shadow-sm border">
                                    <p className="text-xs text-gray-500">Total Records</p>
                                    <p className="text-lg font-bold text-gray-900">{total}</p>
                                </div>
                                <div className="bg-white rounded-xl px-4 py-2 shadow-sm border">
                                    <p className="text-xs text-gray-500">Page Revenue</p>
                                    <p className="text-lg font-bold text-green-600">
                                        {totalRevenue.toLocaleString()} XAF
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Search & Filters */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="mb-6 space-y-3"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by ticket #, customer, recorder, or method..."
                                    className="pl-10"
                                />
                            </div>
                            <Button
                                variant={showFilters ? "default" : "outline"}
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                                className="gap-2"
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                            </Button>
                            {hasActiveFilters && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                    <X className="w-4 h-4" />
                                    Clear
                                </Button>
                            )}
                        </div>

                        {showFilters && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-end gap-4 p-4 bg-white rounded-xl border"
                            >
                                <div className="space-y-1.5 flex-1">
                                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        From
                                    </Label>
                                    <Input
                                        type="date"
                                        value={dateFrom}
                                        onChange={(e) => setDateFrom(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5 flex-1">
                                    <Label className="text-xs text-gray-500 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        To
                                    </Label>
                                    <Input
                                        type="date"
                                        value={dateTo}
                                        onChange={(e) => setDateTo(e.target.value)}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </motion.div>

                    {/* Payments Table */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                    >
                        <Card>
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="flex items-center justify-center py-12">
                                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : payments.length === 0 ? (
                                    <div className="text-center py-12">
                                        <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                        <p className="text-gray-500 font-medium">
                                            No payments found
                                        </p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            {hasActiveFilters
                                                ? "Try adjusting your search or filters"
                                                : "Payment records will appear here"}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b bg-gray-50/50">
                                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Date & Time
                                                    </th>
                                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Ticket
                                                    </th>
                                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Customer
                                                    </th>
                                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Amount
                                                    </th>
                                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Method
                                                    </th>
                                                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Recorded By
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {payments.map((payment, i) => (
                                                    <motion.tr
                                                        key={payment.id}
                                                        initial={{ opacity: 0, y: 5 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: i * 0.03 }}
                                                        className="border-b last:border-0 hover:bg-gray-50/50 transition-colors"
                                                    >
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                                <div>
                                                                    <p className="text-gray-900">
                                                                        {new Date(
                                                                            payment.createdAt
                                                                        ).toLocaleDateString()}
                                                                    </p>
                                                                    <p className="text-xs text-gray-400">
                                                                        {new Date(
                                                                            payment.createdAt
                                                                        ).toLocaleTimeString([], {
                                                                            hour: "2-digit",
                                                                            minute: "2-digit",
                                                                        })}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <a
                                                                href={`${basePath.replace(
                                                                    "/payments",
                                                                    "/tickets"
                                                                )}/${payment.ticketId}`}
                                                                className="text-sm font-mono text-blue-600 hover:underline"
                                                            >
                                                                #{payment.ticket.ticketNumber}
                                                            </a>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900">
                                                                    {payment.ticket.customer.name}
                                                                </p>
                                                                <p className="text-xs text-gray-400">
                                                                    {payment.ticket.customer.phone}
                                                                </p>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="text-sm font-semibold text-green-700">
                                                                +{Number(payment.amount).toLocaleString()} XAF
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700">
                                                                <CreditCard className="w-3 h-3" />
                                                                {payment.paymentMethod}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                                <User className="w-3.5 h-3.5 text-gray-400" />
                                                                {payment.recordedBy.username}
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="flex items-center justify-between mt-4"
                        >
                            <p className="text-sm text-gray-500">
                                Showing {(page - 1) * limit + 1}–
                                {Math.min(page * limit, total)} of {total}
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page <= 1}
                                    onClick={() => goToPage(page - 1)}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <span className="text-sm text-gray-700">
                                    Page {page} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page >= totalPages}
                                    onClick={() => goToPage(page + 1)}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </main>
            </div>
        </div>
    );
}
