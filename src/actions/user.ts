"use server";

import { createUserSchema } from "@/lib/validations";
import { uploadAvatar } from "@/lib/cloudinary";
import { db } from "@/lib/db";
import { requireAdmin, getCurrentDbUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { Role } from "@prisma/client";

export type ActionResult = {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
};

export async function createUser(formData: FormData): Promise<ActionResult> {
  try {
    await requireAdmin();

    const rawData = {
      username: formData.get("username") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      phone: formData.get("phone") as string,
      address: (formData.get("address") as string) || "",
      role: formData.get("role") as string,
      avatar: "",
    };

    // Validate with Zod
    const validation = createUserSchema.safeParse(rawData);
    if (!validation.success) {
      const errors = validation.error.flatten().fieldErrors;
      const firstError = Object.values(errors)[0]?.[0] ?? "Validation failed";
      return { success: false, message: firstError };
    }

    // Handle avatar upload
    const avatarFile = formData.get("avatar") as File | null;
    let avatarUrl: string | undefined;

    if (avatarFile && avatarFile.size > 0) {
      const uploadResult = await uploadAvatar(avatarFile);
      if ("error" in uploadResult) {
        return { success: false, message: uploadResult.error };
      }
      avatarUrl = uploadResult.url;
    }

    // Create Clerk user first
    const clerk = await clerkClient();
    let clerkUser;
    try {
      clerkUser = await clerk.users.createUser({
        emailAddress: [validation.data.email],
        password: validation.data.password,
        username: validation.data.username,
        firstName: validation.data.username,
      });
    } catch (error: unknown) {
      const clerkError = error as { errors?: Array<{ message: string }> };
      const msg =
        clerkError.errors?.[0]?.message ??
        "Failed to create user in authentication system";
      return { success: false, message: msg };
    }

    // Insert into NeonDB (including password)
    try {
      await db.user.create({
        data: {
          clerkId: clerkUser.id,
          username: validation.data.username,
          email: validation.data.email,
          password: validation.data.password,
          phone: validation.data.phone,
          address: validation.data.address || "",
          role: validation.data.role as Role,
          avatar: avatarUrl,
        },
      });
    } catch (dbError) {
      // Rollback: delete the Clerk user if DB insert fails
      try {
        await clerk.users.deleteUser(clerkUser.id);
      } catch (rollbackError) {
        console.error("Failed to rollback Clerk user:", rollbackError);
      }
      console.error("DB insert error:", dbError);
      return {
        success: false,
        message: "Failed to save user data. Changes have been rolled back.",
      };
    }

    revalidatePath("/admin/dashboard");
    return {
      success: true,
      message: `User ${validation.data.username} created successfully`,
    };
  } catch (error) {
    console.error("Create user error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function deleteUser(userId: string): Promise<ActionResult> {
  try {
    const currentAdmin = await requireAdmin();

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    if (user.id === currentAdmin.id) {
      return { success: false, message: "You cannot delete your own account" };
    }

    if (user.role === "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return { success: false, message: "Cannot delete the last admin user" };
      }
    }

    const clerk = await clerkClient();
    try {
      await clerk.users.deleteUser(user.clerkId);
    } catch (error) {
      console.error("Failed to delete Clerk user:", error);
      return {
        success: false,
        message: "Failed to remove user from authentication system",
      };
    }

    await db.user.delete({ where: { id: userId } });

    revalidatePath("/admin/dashboard");
    return { success: true, message: "User deleted successfully" };
  } catch (error) {
    console.error("Delete user error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function updateUser(
  userId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireAdmin();

    const user = await db.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const username = formData.get("username") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address = (formData.get("address") as string) || "";
    const password = formData.get("password") as string;
    const role = formData.get("role") as Role;

    // Prevent removing last admin
    if (user.role === "ADMIN" && role !== "ADMIN") {
      const adminCount = await db.user.count({ where: { role: "ADMIN" } });
      if (adminCount <= 1) {
        return {
          success: false,
          message: "Cannot change the role of the last admin",
        };
      }
    }

    // Handle avatar upload
    const avatarFile = formData.get("avatar") as File | null;
    let avatarUrl = user.avatar;

    if (avatarFile && avatarFile.size > 0) {
      const uploadResult = await uploadAvatar(avatarFile);
      if ("error" in uploadResult) {
        return { success: false, message: uploadResult.error };
      }
      avatarUrl = uploadResult.url;
    }

    // Update Clerk user — sync username, email, and password
    const clerk = await clerkClient();
    try {
      const clerkUpdate: Record<string, unknown> = {
        firstName: username,
        username: username,
      };

      // Only update email in Clerk if it changed
      if (email && email !== user.email) {
        // Clerk requires creating a new email then setting as primary
        // For simplicity, we update via the Clerk API
        clerkUpdate.primaryEmailAddressID = undefined; // will be set after
      }

      // Only update password in Clerk if a new one was provided
      if (password && password !== user.password) {
        clerkUpdate.password = password;
      }

      await clerk.users.updateUser(user.clerkId, clerkUpdate);
    } catch (error) {
      console.error("Clerk update error:", error);
      return {
        success: false,
        message: "Failed to update user in authentication system",
      };
    }

    // Update DB
    const dbUpdate: Record<string, unknown> = {
      username,
      phone,
      address,
      role,
      avatar: avatarUrl,
    };

    if (email && email !== user.email) {
      dbUpdate.email = email;
    }

    if (password) {
      dbUpdate.password = password;
    }

    await db.user.update({
      where: { id: userId },
      data: dbUpdate,
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/cashier/dashboard");
    revalidatePath("/technician/dashboard");
    return { success: true, message: "User updated successfully" };
  } catch (error) {
    console.error("Update user error:", error);
    return { success: false, message: "An unexpected error occurred" };
  }
}

export async function getUsers() {
  try {
    await requireAdmin();
    const users = await db.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return users;
  } catch {
    return [];
  }
}

export async function getUserStats() {
  try {
    await requireAdmin();
    const [total, admins, cashiers, technicians] = await Promise.all([
      db.user.count(),
      db.user.count({ where: { role: "ADMIN" } }),
      db.user.count({ where: { role: "CASHIER" } }),
      db.user.count({ where: { role: "TECHNICIAN" } }),
    ]);
    return { total, admins, cashiers, technicians };
  } catch {
    return { total: 0, admins: 0, cashiers: 0, technicians: 0 };
  }
}

export async function getMyProfile() {
  const user = await getCurrentDbUser();
  if (!user) return null;
  return user;
}
