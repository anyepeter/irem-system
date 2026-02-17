"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, Search, UserCircle, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/lib/utils";
import { useClerk } from "@clerk/nextjs";

type HeaderProps = {
  title: string;
  subtitle?: string;
  username: string;
  avatar?: string | null;
  role?: "ADMIN" | "CASHIER" | "TECHNICIAN";
};

const profilePaths = {
  ADMIN: "/admin/profile",
  CASHIER: "/cashier/profile",
  TECHNICIAN: "/technician/profile",
};

export function Header({ title, subtitle, username, avatar, role }: HeaderProps) {
  const profileHref = role ? profilePaths[role] : "#";
  const { signOut } = useClerk();

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200"
    >
      <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
        {/* Left: Title */}
        <div className="pl-12 lg:pl-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-500 hover:bg-gray-200 transition-colors">
            <Search className="w-4 h-4" />
            <span className="hidden md:inline">Search...</span>
          </button>
          <button className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-600 rounded-full" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <Avatar className="w-9 h-9 cursor-pointer hover:ring-2 hover:ring-blue-400 hover:ring-offset-2 transition-all">
                  <AvatarImage src={avatar ?? undefined} alt={username} />
                  <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-semibold">
                    {getInitials(username)}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div>
                  <p className="text-sm font-medium">{username}</p>
                  <p className="text-xs text-gray-500 capitalize">{role?.toLowerCase()}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={profileHref} className="flex items-center gap-2 cursor-pointer">
                  <UserCircle className="w-4 h-4 text-gray-400" />
                  My Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut({ redirectUrl: "/auth/login" })}
                className="text-red-600 focus:bg-red-50 focus:text-red-600 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </motion.header>
  );
}
