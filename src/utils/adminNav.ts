import { LayoutDashboard, Users, ShieldAlert, Wallet, BarChart3 } from "lucide-react";
import type { TFunction } from "i18next";
import type { DashboardNavItem } from "../components/DashboardLayout";

/** Sidebar nav for the admin console shell — one route per console section. */
export function buildAdminNav(t: TFunction): DashboardNavItem[] {
  return [
    { key: "overview", label: t("admin.navOverview"), icon: LayoutDashboard, to: "/admin", end: true },
    { key: "accounts", label: t("admin.navAccounts"), icon: Users, to: "/admin/accounts" },
    { key: "moderation", label: t("admin.navModeration"), icon: ShieldAlert, to: "/admin/moderation" },
    { key: "payouts", label: t("admin.navPayouts"), icon: Wallet, to: "/admin/payouts" },
    { key: "insights", label: t("admin.navInsights"), icon: BarChart3, to: "/admin/insights" },
  ];
}
