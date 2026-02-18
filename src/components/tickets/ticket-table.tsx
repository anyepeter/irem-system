"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { TicketStatusBadge } from "./ticket-status-badge";
import {
  checkTicketRelatedData,
  cascadeDeleteTicket,
  type DeleteCheckResult,
} from "@/actions/delete";
import { PRIORITY_COLORS } from "@/lib/ticket-constants";
import {
  Trash2,
  Eye,
  Crown,
  Smartphone,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type TicketRow = {
  id: string;
  ticketNumber: string;
  status: string;
  priority: string;
  deviceType: string;
  brand: string;
  totalAmount: unknown;
  createdAt: Date | string;
  customer: { id: number; name: string; phone: string; isVIP: boolean };
  assignedTo: { id: string; username: string };
  createdBy: { username: string };
};

type Props = {
  tickets: TicketRow[];
  canDelete: boolean;
  basePath: string;
  onDataChange?: () => void;
};

export function TicketTable({ tickets, canDelete, basePath, onDataChange }: Props) {
  const [deleteTarget, setDeleteTarget] = useState<TicketRow | null>(null);
  const [checkResult, setCheckResult] = useState<DeleteCheckResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleDeleteClick = async (ticket: TicketRow) => {
    setDeleteTarget(ticket);
    setCheckResult(null);
    setDeleteResult(null);
    setCheckLoading(true);
    const result = await checkTicketRelatedData(ticket.id);
    setCheckResult(result);
    setCheckLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteResult(null);

    const res = await cascadeDeleteTicket(deleteTarget.id);
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

  return (
    <>
      <Card className="overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Ticket #
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Customer
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Device
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Assigned To
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Priority
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Date
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence>
                {tickets.map((ticket, i) => (
                  <motion.tr
                    key={ticket.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={`${basePath}/${ticket.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-900">
                          {ticket.customer.name}
                        </span>
                        {ticket.customer.isVIP && (
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Smartphone className="w-3.5 h-3.5 text-gray-400" />
                        {ticket.brand} {ticket.deviceType}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {ticket.assignedTo.username}
                    </td>
                    <td className="px-6 py-4">
                      <TicketStatusBadge status={ticket.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          PRIORITY_COLORS[ticket.priority] || ""
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(ticket.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`${basePath}/${ticket.id}`}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(ticket)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {tickets.map((ticket, i) => (
            <motion.div
              key={ticket.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <Link
                  href={`${basePath}/${ticket.id}`}
                  className="text-sm font-medium text-blue-600"
                >
                  {ticket.ticketNumber}
                </Link>
                <TicketStatusBadge status={ticket.status} />
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  {ticket.customer.name}
                  {ticket.customer.isVIP && (
                    <Crown className="w-3 h-3 text-amber-500" />
                  )}
                </div>
                <div className="text-xs text-gray-400">
                  {ticket.brand} {ticket.deviceType} &middot;{" "}
                  {ticket.assignedTo.username}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">
                  {formatDate(ticket.createdAt)}
                </span>
                <div className="flex items-center gap-1">
                  <Link href={`${basePath}/${ticket.id}`}>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-red-600"
                      onClick={() => handleDeleteClick(ticket)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {tickets.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Smartphone className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              No tickets found
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Create a ticket to get started
            </p>
          </div>
        )}
      </Card>

      {/* Delete confirmation */}
      <DeleteConfirmationModal
        open={!!deleteTarget}
        onClose={handleCloseDelete}
        checkResult={checkResult}
        loading={checkLoading}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
        result={deleteResult}
        entityType="Ticket"
      />
    </>
  );
}
