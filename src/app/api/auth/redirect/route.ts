import { currentUser, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { getRoleRedirectPath } from "@/lib/rbac";
import { bootstrapAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Check if user exists in DB
    let dbUser = await db.user.findUnique({
      where: { clerkId: clerkUser.id },
    });

    // Bootstrap: if no users exist, make first user admin
    if (!dbUser) {
      // Get the password from the temporary cookie set during login
      const cookieStore = await cookies();
      const tempPassword = cookieStore.get("_temp_bp")?.value ?? "";

      const bootstrapped = await bootstrapAdmin(
        clerkUser.id,
        clerkUser.emailAddresses[0]?.emailAddress ?? "",
        clerkUser.firstName ?? clerkUser.username ?? "Admin",
        tempPassword
      );

      if (bootstrapped) {
        dbUser = bootstrapped;
        // Clear the temp cookie
        const response = NextResponse.redirect(
          new URL(getRoleRedirectPath(dbUser.role), req.url)
        );
        response.cookies.delete("_temp_bp");
        return response;
      } else {
        // User signed in via Clerk but is NOT in our DB.
        const clerk = await clerkClient();
        try {
          await clerk.sessions.revokeSession(clerkUser.id);
        } catch {
          // Session revoke may fail
        }
        return NextResponse.redirect(
          new URL("/auth/login?error=no_account", req.url)
        );
      }
    }

    const redirectPath = getRoleRedirectPath(dbUser.role);
    return NextResponse.redirect(new URL(redirectPath, req.url));
  } catch (error) {
    console.error("Auth redirect error:", error);
    return NextResponse.redirect(new URL("/auth/login?error=server", req.url));
  }
}
