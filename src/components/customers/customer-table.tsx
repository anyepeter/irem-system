"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CustomerFormDialog } from "./customer-form-dialog";
import { deleteCustomer, type ActionResult } from "@/actions/customer";
import {
  Trash2,
  Loader2,
  AlertTriangle,
  Pencil,
  Crown,
  Phone,
  User,
  MapPin,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type Customer = {
  id: number;
  name: string;
  phone: string;
  address: string;
  isVIP: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: { username: string };
};

type CustomerTableProps = {
  customers: Customer[];
  canDelete: boolean;
  onDataChange?: () => void;
};

export function CustomerTable({ customers, canDelete, onDataChange }: CustomerTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<ActionResult | null>(null);
  const [editTarget, setEditTarget] = useState<Customer | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteResult(null);

    const res = await deleteCustomer(deleteTarget.id);
    setDeleteResult(res);
    setDeleting(false);

    if (res.success) {
      setTimeout(() => {
        setDeleteTarget(null);
        setDeleteResult(null);
        onDataChange?.();
      }, 1000);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Customer
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Phone
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Address
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Status
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                  Created By
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
                {customers.map((customer, i) => (
                  <motion.tr
                    key={customer.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                          {customer.isVIP ? (
                            <Crown className="w-4 h-4 text-amber-500" />
                          ) : (
                            <User className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {customer.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        {customer.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        {customer.address || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={customer.isVIP ? "vip" : "regular"}>
                        {customer.isVIP ? "VIP" : "Regular"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {customer.createdBy.username}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(customer.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditTarget(customer)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteTarget(customer)}
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
          {customers.map((customer, i) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                  {customer.isVIP ? (
                    <Crown className="w-4 h-4 text-amber-500" />
                  ) : (
                    <User className="w-4 h-4 text-blue-500" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {customer.name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {customer.phone}
                  </p>
                  {customer.address && (
                    <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {customer.address}
                    </p>
                  )}
                  <Badge
                    variant={customer.isVIP ? "vip" : "regular"}
                    className="mt-1 text-[10px]"
                  >
                    {customer.isVIP ? "VIP" : "Regular"}
                  </Badge>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditTarget(customer)}
                  className="text-gray-400 hover:text-blue-600"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                {canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(customer)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {customers.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">
              No customers found
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Create your first customer to get started
            </p>
          </div>
        )}
      </Card>

      {/* Edit dialog */}
      {editTarget && (
        <CustomerFormDialog
          open={!!editTarget}
          onOpenChange={(v) => {
            if (!v) setEditTarget(null);
          }}
          customer={editTarget}
          onSuccess={onDataChange}
        />
      )}

      {/* Delete confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v) {
            setDeleteTarget(null);
            setDeleteResult(null);
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete Customer
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong>? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>

          {deleteResult && (
            <div
              className={`text-sm px-3 py-2 rounded-lg ${deleteResult.success
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
                }`}
            >
              {deleteResult.message}
            </div>
          )}

          <div className="flex gap-3 justify-end mt-4">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteTarget(null);
                setDeleteResult(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
