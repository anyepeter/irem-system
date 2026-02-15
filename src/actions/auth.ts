"use server";

import { db } from "@/lib/db";

export async function verifyEmailExists(email: string): Promise<{ exists: boolean }> {
  try {
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    });

    // Special case: if no users exist at all, allow sign-in (bootstrap flow)
    if (!user) {
      const count = await db.user.count();
      if (count === 0) {
        return { exists: true };
      }
    }

    return { exists: !!user };
  } catch (error) {
    console.error("Email verification error:", error);
    return { exists: false };
  }
}
