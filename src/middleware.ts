import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/auth/login(.*)",
  "/api/webhooks(.*)",
]);

const isAdminRoute = createRouteMatcher(["/admin(.*)"]);
const isCashierRoute = createRouteMatcher(["/cashier(.*)"]);
const isTechnicianRoute = createRouteMatcher(["/technician(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Allow public routes
  if (isPublicRoute(req)) {
    if (userId) {
      // Logged-in user visiting login page — redirect to role-check
      const url = new URL("/api/auth/redirect", req.url);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protect all non-public routes
  if (!userId) {
    const loginUrl = new URL("/auth/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based route protection via header check
  // The actual DB role check happens in page-level server components
  // Middleware ensures authentication; pages enforce authorization
  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
