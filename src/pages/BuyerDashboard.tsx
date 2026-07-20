import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import {
  Package,
  Star,
  FileText,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Truck,
  Users,
  Gift,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { LineChart, DonutChart, CHART_COLORS } from "../components/charts";
import {
  fetchOrders,
  getLoyalty,
  getReferral,
  getCorporateAnalytics,
  listRfqs,
  listInvoices,
  type CorporateAnalytics,
  type Loyalty,
  type Rfq,
  type Invoice,
} from "../api/endpoints";
import type { Order } from "../types/order";
import { formatPrice } from "../utils/format";
import { ACTIVE_STATUSES, buildBuyerNav, statusBadge } from "../utils/buyerDash";

// ISO-ish week key, e.g. "2026-W29".
function weekKey(iso: string): string {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week =
    1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** A single KPI stat card in the receipt-stub style used across the app. */
function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: string;
}) {
  return (
    <div className="receipt-stub bg-white border border-forest-300 p-4">
      <p className="flex items-center gap-1 text-xs text-forest-500 mb-1">
        <Icon size={14} /> {label}
      </p>
      <p className="font-mono text-xl text-forest-950 truncate">{value}</p>
    </div>
  );
}

export default function BuyerDashboard() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const isBuyer = user?.role === "individual_buyer" || user?.role === "corporate_buyer";
  const isCorporate = user?.role === "corporate_buyer";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null);
  const [referral, setReferral] = useState<{ code: string; referrals: number } | null>(null);
  const [analytics, setAnalytics] = useState<CorporateAnalytics | null>(null);
  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");

  useEffect(() => {
    // Wrapped in an async fn so no setState runs synchronously in the effect body.
    const run = async () => {
      if (!(isAuthenticated && isBuyer)) {
        setLoading(false);
        return;
      }
      try {
        const buyerOrders = await fetchOrders("buyer");
        setOrders(buyerOrders);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
      getLoyalty().then(setLoyalty).catch(() => {});
      getReferral().then(setReferral).catch(() => {});
      if (isCorporate) {
        getCorporateAnalytics().then(setAnalytics).catch(() => {});
        listRfqs().then(setRfqs).catch(() => {});
        listInvoices().then(setInvoices).catch(() => {});
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  const derived = useMemo(() => {
    const sorted = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const totalSpent = orders.reduce((s, o) => s + o.totalAmount, 0);
    const activeDeliveries = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
    const now = new Date();
    const spendThisMonth = orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, o) => s + o.totalAmount, 0);

    // Bucket spend into daily / weekly points for the trend chart.
    const buckets = new Map<string, number>();
    for (const o of sorted) {
      const key = period === "daily" ? o.createdAt.slice(0, 10) : weekKey(o.createdAt);
      buckets.set(key, (buckets.get(key) ?? 0) + o.totalAmount);
    }
    const entries = [...buckets.entries()].slice(-8);
    const labels = entries.map(([k]) => (period === "daily" ? k.slice(5) : k.slice(5)));
    const values = entries.map(([, v]) => v);

    const recent = [...sorted].reverse().slice(0, 5);
    return { totalSpent, activeDeliveries, spendThisMonth, labels, values, recent };
  }, [orders, period]);

  const supplierSegments = useMemo(() => {
    const palette = [CHART_COLORS.LEAF, CHART_COLORS.CLAY, CHART_COLORS.FOREST, "var(--color-forest-500)", "var(--color-forest-300)"];
    return (analytics?.suppliers ?? [])
      .slice(0, 5)
      .map((s, i) => ({ label: s.sellerName, value: s.spend, color: palette[i % palette.length] }));
  }, [analytics]);

  const nav = buildBuyerNav(user?.role, t);

  // ---- Guards ----
  if (!isAuthenticated) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">{t("buyerDash.loginPrompt")}</p>
        <Link to="/login" className="text-forest-800 underline">{t("seller.login")}</Link>
      </section>
    );
  }
  if (!isBuyer) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body">{t("buyerDash.guardMsg")}</p>
      </section>
    );
  }

  const openRfqs = rfqs.filter((r) => r.status === "open" || r.status === "quoted").length;
  const outstandingInvoices = invoices.filter((i) => i.status === "issued" || i.status === "overdue").length;

  const periodToggle = (
    <div className="flex bg-forest-300/25 rounded-md p-0.5 text-xs">
      {(["daily", "weekly"] as const).map((p) => (
        <button
          key={p}
          onClick={() => setPeriod(p)}
          className={`px-3 py-1 rounded ${period === p ? "bg-forest-800 text-cream" : "text-forest-800"}`}
        >
          {t(`dash.${p}`)}
        </button>
      ))}
    </div>
  );

  return (
    <DashboardLayout title={t("buyerDash.title")} nav={nav}>
      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {isCorporate ? (
          <>
            <StatCard icon={TrendingUp} label={t("buyerDash.kpiTotalSpend")} value={formatPrice(analytics?.spendTotal ?? derived.totalSpent)} />
            <StatCard icon={Receipt} label={t("buyerDash.kpiSpendThisMonth")} value={formatPrice(analytics?.spendThisMonth ?? derived.spendThisMonth)} />
            <StatCard icon={ShoppingBag} label={t("buyerDash.kpiOrders")} value={String(analytics?.orderCount ?? orders.length)} />
            <StatCard icon={Users} label={t("buyerDash.kpiSuppliers")} value={String(analytics?.suppliers.length ?? 0)} />
          </>
        ) : (
          <>
            <StatCard icon={ShoppingBag} label={t("buyerDash.kpiTotalOrders")} value={String(orders.length)} />
            <StatCard icon={TrendingUp} label={t("buyerDash.kpiTotalSpent")} value={formatPrice(derived.totalSpent)} />
            <StatCard icon={Star} label={t("buyerDash.kpiLoyalty")} value={String(loyalty?.balance ?? 0)} />
            <StatCard icon={Truck} label={t("buyerDash.kpiActiveDeliveries")} value={String(derived.activeDeliveries)} />
          </>
        )}
      </div>

      {/* Spend trend + (corporate) supplier donut */}
      <div className="grid lg:grid-cols-3 gap-4 mb-6">
        <div className={`receipt-stub bg-white border border-forest-300 p-4 ${isCorporate ? "lg:col-span-2" : "lg:col-span-3"}`}>
          <div className="flex items-center justify-between mb-3">
            <p className="font-body font-semibold text-forest-800 flex items-center gap-1">
              <TrendingUp size={16} /> {t("buyerDash.spendTrend")}
            </p>
            {periodToggle}
          </div>
          <div className="overflow-x-auto">
            {derived.values.length > 0 ? (
              <LineChart
                labels={derived.labels}
                series={[{ name: t("buyerDash.spendTrend"), color: CHART_COLORS.LEAF, values: derived.values }]}
                format={(v) => formatPrice(v)}
              />
            ) : (
              <p className="text-forest-500 text-sm py-10 text-center">{t("buyerDash.noOrders")}</p>
            )}
          </div>
        </div>

        {isCorporate && (
          <div className="receipt-stub bg-white border border-forest-300 p-4">
            <p className="font-body font-semibold text-forest-800 mb-3 flex items-center gap-1">
              <Users size={16} /> {t("buyerDash.suppliersBreakdown")}
            </p>
            {supplierSegments.length > 0 ? (
              <div className="flex justify-center">
                <DonutChart segments={supplierSegments} centerLabel={t("buyerDash.kpiSuppliers")} centerValue={String(supplierSegments.length)} />
              </div>
            ) : (
              <p className="text-forest-500 text-sm py-10 text-center">{t("buyerDash.noOrders")}</p>
            )}
          </div>
        )}
      </div>

      {/* Corporate quick tiles */}
      {isCorporate && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link to="/rfqs" className="receipt-stub bg-white border border-forest-300 p-4 hover:border-forest-500 transition">
            <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><FileText size={14} /> {t("buyerDash.openRfqs")}</p>
            <p className="font-mono text-xl text-forest-950">{openRfqs}</p>
          </Link>
          <Link to="/invoices" className="receipt-stub bg-white border border-forest-300 p-4 hover:border-forest-500 transition">
            <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><Receipt size={14} /> {t("buyerDash.outstandingInvoices")}</p>
            <p className="font-mono text-xl text-forest-950">{outstandingInvoices}</p>
          </Link>
        </div>
      )}

      {/* Individual: loyalty + referral */}
      {!isCorporate && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="receipt-stub bg-white border border-forest-300 p-4">
            <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><Star size={14} /> {t("buyerDash.loyaltyRewards")}</p>
            <p className="font-mono text-2xl text-forest-950">{loyalty?.balance ?? 0}</p>
          </div>
          <div className="receipt-stub bg-white border border-forest-300 p-4">
            <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><Gift size={14} /> {t("buyerDash.referral")}</p>
            <p className="font-mono text-lg text-forest-950">{referral?.code ?? "…"}</p>
            <p className="text-[11px] text-forest-500">{t("account.referralsCount", { count: referral?.referrals ?? 0 })}</p>
          </div>
        </div>
      )}

      {/* Recent orders */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-body font-semibold text-forest-800 flex items-center gap-1">
          <Package size={16} /> {t("buyerDash.recentOrders")}
        </h2>
        <Link to="/dashboard/orders" className="text-xs text-forest-800 underline">{t("buyerDash.viewAll")}</Link>
      </div>
      <OrdersTable orders={derived.recent} loading={loading} t={t} />
    </DashboardLayout>
  );
}

// Shared table used by the overview (recent) and BuyerOrders (full history).
export function OrdersTable({ orders, loading, t }: { orders: Order[]; loading: boolean; t: TFunction }) {
  if (loading) {
    return <p className="text-forest-800/70 font-body py-8 text-center">{t("common.loading")}</p>;
  }
  if (orders.length === 0) {
    return (
      <div className="receipt-stub bg-white border border-forest-300 p-8 text-center">
        <p className="text-forest-800/70 font-body mb-1">{t("buyerDash.noOrders")}</p>
        <p className="text-forest-500 text-sm mb-4">{t("buyerDash.noOrdersHint")}</p>
        <Link to="/browse" className="inline-block bg-forest-800 text-cream px-4 py-2 rounded-md text-sm font-medium hover:bg-forest-950 transition">
          {t("buyerDash.startShopping")}
        </Link>
      </div>
    );
  }
  return (
    <div className="receipt-stub bg-white border border-forest-300 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-forest-500 border-b border-forest-300">
            <th className="px-4 py-2 font-medium">{t("buyerDash.thOrder")}</th>
            <th className="px-4 py-2 font-medium">{t("buyerDash.thDate")}</th>
            <th className="px-4 py-2 font-medium text-right">{t("buyerDash.thAmount")}</th>
            <th className="px-4 py-2 font-medium">{t("buyerDash.thStatus")}</th>
            <th className="px-4 py-2" />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const badge = statusBadge(o.status, t);
            const firstItem = o.items?.[0]?.productName ?? "—";
            const extra = (o.items?.length ?? 0) - 1;
            const active = ACTIVE_STATUSES.includes(o.status) || o.status === "placed";
            return (
              <tr key={o.id} className="border-b border-forest-300/50 last:border-0">
                <td className="px-4 py-3">
                  <p className="text-forest-950 truncate max-w-[180px]">{firstItem}</p>
                  {extra > 0 && <p className="text-[11px] text-forest-500">{t("buyerDash.itemsCount", { count: o.items.length })}</p>}
                </td>
                <td className="px-4 py-3 text-forest-500 whitespace-nowrap">{o.createdAt.slice(0, 10)}</td>
                <td className="px-4 py-3 text-right font-mono text-forest-950 whitespace-nowrap">{formatPrice(o.totalAmount)}</td>
                <td className="px-4 py-3"><span className={`text-[11px] px-2 py-0.5 rounded ${badge.cls}`}>{badge.label}</span></td>
                <td className="px-4 py-3 text-right">
                  {active && (
                    <Link to={`/order-tracking/${o.id}`} className="text-xs text-forest-800 underline whitespace-nowrap">
                      {t("buyerDash.track")}
                    </Link>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
