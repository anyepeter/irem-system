"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Shield,
  ChevronLeft,
  Menu,
  X,
  DollarSign,
  Wrench,
  LogOut,
  UserCircle,
  Contact,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

type SidebarItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const adminItems: SidebarItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Customers", href: "/admin/customers", icon: Contact },
  { label: "My Profile", href: "/admin/profile", icon: UserCircle },
];

const cashierItems: SidebarItem[] = [
  { label: "Dashboard", href: "/cashier/dashboard", icon: LayoutDashboard },
  { label: "Customers", href: "/cashier/customers", icon: Contact },
  { label: "My Profile", href: "/cashier/profile", icon: UserCircle },
];

const technicianItems: SidebarItem[] = [
  { label: "Dashboard", href: "/technician/dashboard", icon: LayoutDashboard },
  { label: "My Profile", href: "/technician/profile", icon: UserCircle },
];

const roleConfig = {
  ADMIN: { items: adminItems, icon: Shield, color: "text-purple-600", bgColor: "bg-purple-50" },
  CASHIER: { items: cashierItems, icon: DollarSign, color: "text-emerald-600", bgColor: "bg-emerald-50" },
  TECHNICIAN: { items: technicianItems, icon: Wrench, color: "text-amber-600", bgColor: "bg-amber-50" },
};

export function Sidebar({ role, username }: { role: "ADMIN" | "CASHIER" | "TECHNICIAN"; username: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { signOut } = useClerk();
  const config = roleConfig[role];

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3"
            >
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", config.bgColor)}>
                <config.icon className={cn("w-5 h-5", config.color)} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">System</h2>
                <p className="text-xs text-gray-500 capitalize">{role.toLowerCase()} Panel</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className={cn("w-4 h-4 text-gray-500 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-1">
        {config.items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-blue-600" : "text-gray-400")} />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="p-3 border-t border-gray-200">
        <div className={cn("flex items-center gap-3 px-3 py-2 mb-2", collapsed && "justify-center")}>
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white", "bg-gradient-to-br from-blue-500 to-blue-700")}>
            {username.charAt(0).toUpperCase()}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{username}</p>
              <p className="text-xs text-gray-500 capitalize">{role.toLowerCase()}</p>
            </div>
          )}
        </div>
        <button
          onClick={() => signOut({ redirectUrl: "/auth/login" })}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors w-full",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="lg:hidden fixed inset-y-0 left-0 w-[280px] bg-white border-r border-gray-200 z-50 flex flex-col"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 280 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="hidden lg:flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 overflow-hidden"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
}
