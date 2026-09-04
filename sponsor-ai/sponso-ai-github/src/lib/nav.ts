import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  Building2,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  Send,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import type { SessionUser } from "@/lib/auth";

export type AppNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  match?: "exact" | "prefix" | "applications";
};

export function navForRole(role: SessionUser["role"]): AppNavItem[] {
  if (role === "ADMIN") {
    return [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, match: "exact" },
      { href: "/coordinator", label: "Applications", icon: ClipboardList, match: "applications" },
      { href: "/admin/users", label: "User accounts", icon: Users },
      { href: "/admin/lookups", label: "Institutions & LLGs", icon: Building2 },
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { href: "/admin/audit", label: "Audit trail", icon: ScrollText },
      { href: "/admin/reports", label: "Reports", icon: BarChart3 },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/notifications", label: "Notices", icon: Bell },
    ];
  }
  if (role === "COORDINATOR") {
    return [
      { href: "/coordinator", label: "Applications", icon: ClipboardList, match: "applications" },
      { href: "/coordinator/notices", label: "Send notice", icon: Send },
      { href: "/coordinator/reports", label: "Reports", icon: BarChart3 },
      { href: "/notifications", label: "Notices", icon: Bell },
    ];
  }
  return [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard, match: "exact" },
    { href: "/student/apply", label: "Application", icon: FileText },
    { href: "/student/profile", label: "My profile", icon: UserRound },
    { href: "/notifications", label: "Notices", icon: Bell },
  ];
}

export function homeForNav(role: SessionUser["role"]) {
  if (role === "ADMIN") return "/admin";
  if (role === "COORDINATOR") return "/coordinator";
  return "/student";
}

export function workspaceLabel(role: SessionUser["role"]) {
  if (role === "ADMIN") return "Administrator";
  if (role === "COORDINATOR") return "Coordinator";
  return "Applicant";
}

export function navItemActive(pathname: string, item: AppNavItem) {
  if (item.match === "exact") return pathname === item.href;
  if (item.match === "applications") {
    return pathname === "/coordinator" || pathname.startsWith("/coordinator/applications");
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function pageTitleFor(pathname: string, role: SessionUser["role"]) {
  if (pathname.startsWith("/coordinator/applications/")) return "Application review";
  const items = navForRole(role);
  const hit = items.find((item) => navItemActive(pathname, item));
  return hit?.label ?? "HUEF";
}
