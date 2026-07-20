import {
  LayoutDashboard,
  Package,
  Store,
  MessageSquare,
  Star,
  Wallet,
  Settings,
  FileText,
  Receipt,
  Crown,
} from "lucide-react";
import type { TFunction } from "i18next";
import type { DashboardNavItem } from "../components/DashboardLayout";
import type { OrderStatus } from "../types/order";

/** Orders still in flight — used for the "active deliveries" KPI and Track links. */
export const ACTIVE_STATUSES: OrderStatus[] = ["confirmed", "out_for_delivery"];

/** Role-driven sidebar nav, shared by BuyerDashboard and BuyerOrders. */
export function buildBuyerNav(role: string | undefined, t: TFunction): DashboardNavItem[] {
  const common: DashboardNavItem[] = [
    { key: "overview", label: t("buyerDash.overview"), icon: LayoutDashboard, to: "/dashboard", end: true },
    { key: "orders", label: t("buyerDash.orders"), icon: Package, to: "/dashboard/orders" },
    { key: "browse", label: t("buyerDash.browse"), icon: Store, to: "/browse" },
    { key: "messages", label: t("buyerDash.messages"), icon: MessageSquare, to: "/messages" },
  ];
  const corporate: DashboardNavItem[] =
    role === "corporate_buyer"
      ? [
          { key: "rfqs", label: t("buyerDash.rfqs"), icon: FileText, to: "/rfqs" },
          { key: "invoices", label: t("buyerDash.invoices"), icon: Receipt, to: "/invoices" },
          { key: "subscription", label: t("buyerDash.subscription"), icon: Crown, to: "/subscription" },
        ]
      : [{ key: "loyalty", label: t("buyerDash.loyalty"), icon: Star, to: "/account" }];
  const tail: DashboardNavItem[] = [
    { key: "payments", label: t("buyerDash.payments"), icon: Wallet, to: "/account" },
    { key: "account", label: t("buyerDash.account"), icon: Settings, to: "/account" },
  ];
  return [...common, ...corporate, ...tail];
}

/** Status badge label + tint, reusing the seller-payout tint pattern. */
export function statusBadge(status: OrderStatus, t: TFunction): { label: string; cls: string } {
  const map: Record<OrderStatus, { label: string; cls: string }> = {
    placed: { label: t("buyerDash.statusPlaced"), cls: "bg-forest-300/30 text-forest-800" },
    confirmed: { label: t("buyerDash.statusConfirmed"), cls: "bg-forest-500/20 text-forest-800" },
    out_for_delivery: { label: t("buyerDash.statusOutForDelivery"), cls: "bg-clay/15 text-clay" },
    delivered: { label: t("buyerDash.statusDelivered"), cls: "bg-leaf/15 text-leaf" },
    cancelled: { label: t("buyerDash.statusCancelled"), cls: "bg-clay/15 text-clay" },
  };
  return map[status] ?? { label: status, cls: "bg-forest-300/30 text-forest-800" };
}
