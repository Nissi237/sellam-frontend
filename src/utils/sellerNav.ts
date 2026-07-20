import {
  LayoutDashboard,
  Plus,
  FileText,
  Receipt,
  Banknote,
  MessageSquare,
  Store,
  Wallet,
  Settings,
} from "lucide-react";
import type { TFunction } from "i18next";
import type { DashboardNavItem } from "../components/DashboardLayout";

/** Sidebar nav for the seller dashboard shell. Reuses existing i18n keys. */
export function buildSellerNav(t: TFunction): DashboardNavItem[] {
  return [
    { key: "overview", label: t("buyerDash.overview"), icon: LayoutDashboard, to: "/sell", end: true },
    { key: "new", label: t("seller.newListing"), icon: Plus, to: "/sell/new" },
    { key: "rfqs", label: t("nav.rfqs"), icon: FileText, to: "/rfqs" },
    { key: "invoices", label: t("nav.invoices"), icon: Receipt, to: "/invoices" },
    { key: "financing", label: t("nav.financing"), icon: Banknote, to: "/financing" },
    { key: "messages", label: t("nav.messages"), icon: MessageSquare, to: "/messages" },
    { key: "browse", label: t("buyerDash.browse"), icon: Store, to: "/browse" },
    { key: "payments", label: t("buyerDash.payments"), icon: Wallet, to: "/account" },
    { key: "account", label: t("buyerDash.account"), icon: Settings, to: "/account" },
  ];
}
