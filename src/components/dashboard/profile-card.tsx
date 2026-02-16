"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, User, Mail, Phone, MapPin, Shield, Calendar, Lock } from "lucide-react";
import { getInitials, formatDate } from "@/lib/utils";

type ProfileUser = {
  username: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  avatar: string | null;
  role: "ADMIN" | "CASHIER" | "TECHNICIAN";
  createdAt: string;
};

const roleBadgeVariant = {
  ADMIN: "admin" as const,
  CASHIER: "cashier" as const,
  TECHNICIAN: "technician" as const,
};

export function ProfileCard({ user }: { user: ProfileUser }) {
  const [showPassword, setShowPassword] = useState(false);

  const fields = [
    { label: "Username", value: user.username, icon: User },
    { label: "Email", value: user.email, icon: Mail },
    { label: "Phone", value: user.phone || "-", icon: Phone },
    { label: "Address", value: user.address || "-", icon: MapPin },
    { label: "Role", value: user.role, icon: Shield, isBadge: true },
    { label: "Joined", value: formatDate(user.createdAt), icon: Calendar },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="pb-4">
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar & Name */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pb-6 border-b border-gray-100">
            <Avatar className="w-20 h-20">
              <AvatarImage src={user.avatar ?? undefined} />
              <AvatarFallback className="bg-blue-100 text-blue-700 text-lg font-bold">
                {getInitials(user.username)}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h3 className="text-xl font-semibold text-gray-900">{user.username}</h3>
              <p className="text-sm text-gray-500">{user.email}</p>
              <Badge variant={roleBadgeVariant[user.role]} className="mt-2">
                {user.role}
              </Badge>
            </div>
          </div>

          {/* Profile Fields */}
          <div className="grid gap-4">
            {fields.map((field) => (
              <div key={field.label} className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-50">
                <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                  <field.icon className="w-4 h-4 text-gray-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <Label className="text-xs text-gray-500 uppercase tracking-wider">{field.label}</Label>
                  {field.isBadge ? (
                    <div className="mt-0.5">
                      <Badge variant={roleBadgeVariant[user.role]}>{field.value}</Badge>
                    </div>
                  ) : (
                    <p className="text-sm font-medium text-gray-900 truncate">{field.value}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Password field with toggle */}
            <div className="flex items-center gap-3 py-3 px-4 rounded-xl bg-gray-50">
              <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                <Lock className="w-4 h-4 text-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <Label className="text-xs text-gray-500 uppercase tracking-wider">Password</Label>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className="text-sm font-medium text-gray-900 font-mono">
                    {showPassword ? user.password : "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center pt-2">
            Contact an administrator to update your profile information.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
