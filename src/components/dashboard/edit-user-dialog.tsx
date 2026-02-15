"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateUser, type ActionResult } from "@/actions/user";
import { Pencil, Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import Image from "next/image";

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

type EditUserDialogProps = {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditUserDialog({ user, open, onOpenChange }: EditUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ActionResult | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [role, setRole] = useState(user.role);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [password, setPassword] = useState(user.password);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when user changes or dialog opens
  useEffect(() => {
    if (open) {
      setUsername(user.username);
      setEmail(user.email);
      setPhone(user.phone);
      setPassword(user.password);
      setRole(user.role);
      setAvatarPreview(null);
      setResult(null);
    }
  }, [open, user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const formData = new FormData(e.currentTarget);
    formData.set("role", role);

    const res = await updateUser(user.id, formData);
    setResult(res);
    setLoading(false);

    if (res.success) {
      setTimeout(() => {
        onOpenChange(false);
        setResult(null);
        setAvatarPreview(null);
      }, 1500);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setResult(null); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="w-4 h-4" />
            Edit User
          </DialogTitle>
          <DialogDescription>
            Update {user.username}&apos;s profile. Changes sync to both database and auth system.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Avatar upload */}
          <div className="flex flex-col items-center gap-3">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors overflow-hidden group"
            >
              {avatarPreview || user.avatar ? (
                <Image
                  src={avatarPreview || user.avatar || ""}
                  alt="Avatar"
                  fill
                  className="object-cover"
                />
              ) : (
                <Upload className="w-6 h-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              name="avatar"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <p className="text-xs text-gray-500">Click to change avatar</p>
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label htmlFor="edit-username">Username</Label>
            <Input
              id="edit-username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="edit-password">Password</Label>
            <Input
              id="edit-password"
              name="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password or keep current"
            />
            <p className="text-xs text-gray-500">Leave as-is to keep current password</p>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="edit-phone">Phone</Label>
            <Input
              id="edit-phone"
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as User["role"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="CASHIER">Cashier</SelectItem>
                <SelectItem value="TECHNICIAN">Technician</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Result message */}
          {result && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                result.success ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
              }`}
            >
              {result.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              {result.message}
            </motion.div>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Pencil className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
