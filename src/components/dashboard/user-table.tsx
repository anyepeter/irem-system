"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { EditUserDialog } from "@/components/dashboard/edit-user-dialog";
import { deleteUser, type ActionResult } from "@/actions/user";
import { Trash2, Loader2, AlertTriangle, Pencil, Eye, EyeOff } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";

type User = {
  id: string;
  clerkId: string;
  username: string;
  email: string;
  password: string;
  phone: string;
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

export function UserTable({ users, currentUserId }: { users: User[]; currentUserId: string }) {
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteResult, setDeleteResult] = useState<ActionResult | null>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteResult(null);

    const res = await deleteUser(deleteTarget.id);
    setDeleteResult(res);
    setDeleting(false);

    if (res.success) {
      setTimeout(() => {
        setDeleteTarget(null);
        setDeleteResult(null);
      }, 1000);
    }
  };

  return (
    <>
      <Card className="overflow-hidden">
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
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
                            onClick={() => setDeleteTarget(user)}
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

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-gray-100">
          {users.map((user, i) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="w-10 h-10 shrink-0">
                  <AvatarImage src={user.avatar ?? undefined} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                    {getInitials(user.username)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{user.username}</p>
                  <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  <Badge variant={roleBadgeVariant[user.role]} className="mt-1 text-[10px]">{user.role}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
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
                    onClick={() => setDeleteTarget(user)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                ) : (
                  <span className="text-xs text-gray-400 px-2">You</span>
                )}
              </div>
            </motion.div>
          ))}
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
        />
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) { setDeleteTarget(null); setDeleteResult(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Delete User
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{deleteTarget?.username}</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deleteResult && (
            <div className={`text-sm px-3 py-2 rounded-lg ${deleteResult.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
              {deleteResult.message}
            </div>
          )}

          <div className="flex gap-3 justify-end mt-4">
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteResult(null); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
