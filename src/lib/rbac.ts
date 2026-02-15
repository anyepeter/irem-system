import { Role } from "@prisma/client";

type Permission =
  | "create_user"
  | "delete_user"
  | "edit_user"
  | "assign_roles"
  | "view_dashboard"
  | "manage_system";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    "create_user",
    "delete_user",
    "edit_user",
    "assign_roles",
    "view_dashboard",
    "manage_system",
  ],
  CASHIER: ["view_dashboard"],
  TECHNICIAN: ["view_dashboard"],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function isAdmin(role: Role): boolean {
  return role === "ADMIN";
}

export function getRoleRedirectPath(role: Role): string {
  const paths: Record<Role, string> = {
    ADMIN: "/admin/dashboard",
    CASHIER: "/cashier/dashboard",
    TECHNICIAN: "/technician/dashboard",
  };
  return paths[role] || "/auth/login";
}

export function canAccessRoute(role: Role, pathname: string): boolean {
  if (pathname.startsWith("/admin")) return role === "ADMIN";
  if (pathname.startsWith("/cashier")) return role === "CASHIER" || role === "ADMIN";
  if (pathname.startsWith("/technician")) return role === "TECHNICIAN" || role === "ADMIN";
  return true;
}
