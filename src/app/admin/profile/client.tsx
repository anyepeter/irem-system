"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { ProfileCard } from "@/components/dashboard/profile-card";

type Props = {
  user: {
    username: string;
    email: string;
    password: string;
    phone: string;
    avatar: string | null;
    role: "ADMIN" | "CASHIER" | "TECHNICIAN";
    createdAt: string;
  };
};

export function AdminProfileClient({ user }: Props) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role={user.role} username={user.username} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title="My Profile"
          subtitle="View your account information"
          username={user.username}
          avatar={user.avatar}
          role={user.role}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <ProfileCard user={user} />
        </main>
      </div>
    </div>
  );
}
