"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DeleteConfirmationModal } from "@/components/ui/delete-confirmation-modal";
import { EditUserDialog } from "@/components/dashboard/edit-user-dialog";
import {
  checkUserRelatedData,
  cascadeDeleteUser,
  type DeleteCheckResult,
} from "@/actions/delete";
import { Trash2, Pencil, Eye, EyeOff } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";

type User = {
  id: string;
  clerkId: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  avatar: string | null;
  role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  createdAt: Date;
  updatedAt: Date;
};

const roleBadgeVariant = {
  ADMIN: "admin" as const,
  CASHIER: "cashier" as const,
  TECHNICIAN: "technician" as const,
};

function PasswordCell({ password }: { password: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex items-center gap-1">
      <span className="text-sm text-gray-600 font-mono">
        {visible ? password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
      </span>
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        className="text-gray-400 hover:text-gray-600 transition-colors p-0.5"
      >
        {visible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export function UserTable({ users, currentUserId, onDataChange }: { users: User[]; currentUserId: string; onDataChange?: () => void }) {
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [checkResult, setCheckResult] = useState<DeleteCheckResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<{ success: boolean; message: string } | null>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);

  const handleDeleteClick = async (user: User) => {
    setDeleteTarget(user);
    setCheckResult(null);
    setDeleteResult(null);
    setCheckLoading(true);
    const result = await checkUserRelatedData(user.id);
    setCheckResult(result);
    setCheckLoading(false);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteResult(null);

    const res = await cascadeDeleteUser(deleteTarget.id);
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
        <div className="block overflow-x-auto">
          <table className="w-full min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">User</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Email</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Password</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Phone</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Role</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Joined</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <AnimatePresence>
                {users.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-9 h-9">
                          <AvatarImage src={user.avatar ?? undefined} />
                          <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                            {getInitials(user.username)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-900">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                    <td className="px-6 py-4">
                      <PasswordCell password={user.password} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{user.phone || "-"}</td>
                    <td className="px-6 py-4">
                      <Badge variant={roleBadgeVariant[user.role]}>{user.role}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(user.createdAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditTarget(user)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        {user.id !== currentUserId ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(user)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 px-2">You</span>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-sm">No users found</p>
          </div>
        )}
      </Card>

      {/* Edit user dialog */}
      {editTarget && (
        <EditUserDialog
          user={editTarget}
          open={!!editTarget}
          onOpenChange={(v) => { if (!v) setEditTarget(null); }}
          onSuccess={onDataChange}
        />
      )}

      {/* Delete confirmation */}
      <DeleteConfirmationModal
        open={!!deleteTarget}
        onClose={handleCloseDelete}
        checkResult={checkResult}
        loading={checkLoading}
        onConfirm={handleConfirmDelete}
        deleting={deleting}
        result={deleteResult}
        entityType="User"
      />
    </>
  );
}
