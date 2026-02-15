import { currentUser, auth } from "@clerk/nextjs/server";
import { db } from "./db";
import { redirect } from "next/navigation";
import { getRoleRedirectPath } from "./rbac";
import { Role } from "@prisma/client";

export async function getCurrentDbUser() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const dbUser = await db.user.findUnique({
      where: { clerkId: userId },
    });

    return dbUser;
  } catch (error) {
    console.error("getCurrentDbUser error:", error);
    return null;
  }
}

export async function requireRole(requiredRole: Role) {
  const user = await getCurrentDbUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== requiredRole && user.role !== "ADMIN") {
    redirect(getRoleRedirectPath(user.role));
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentDbUser();

  if (!user) {
    redirect("/auth/login");
  }

  if (user.role !== "ADMIN") {
    redirect(getRoleRedirectPath(user.role));
  }

  return user;
}

export async function bootstrapAdmin(
  clerkId: string,
  email: string,
  username: string,
  password: string
) {
  const userCount = await db.user.count();

  if (userCount === 0) {
    const admin = await db.user.create({
      data: {
        clerkId,
        email,
        username,
        password,
        phone: "",
        role: "ADMIN",
      },
    });
    return admin;
  }

  return null;
}
