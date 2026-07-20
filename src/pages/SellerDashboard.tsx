import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Pencil, Trash2, Eye, EyeOff, TrendingUp, Package, Megaphone, Percent, ShieldCheck, Wallet, RefreshCw, Receipt, Boxes, CalendarDays } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { buildSellerNav } from "../utils/sellerNav";
import { BarChart, CHART_COLORS } from "../components/charts";
import { productImage, hasUsablePhoto } from "../utils/productImage";
import Kanban, { type KanbanColumn } from "../components/Kanban";
import MiniCalendar from "../components/MiniCalendar";
import {
  fetchMyProducts,
  updateProduct,
  deleteProduct as deleteProductApi,
  sponsorProduct,
  createPromotion,
  getSellerAnalytics,
  getSellerDashboard,
  getSellerVerification,
  submitSellerVerification,
  fetchMyPayouts,
  retryPayout,
  type SellerAnalytics,
  type SellerDashboard as SellerDashboardData,
  type SellerVerification,
  type Payout,
} from "../api/endpoints";
import type { Product } from "../types/product";
import { formatPrice } from "../utils/format";

const LOW_STOCK = 5;

export default function SellerDashboard() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [listings, setListings] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SellerAnalytics | null>(null);
  const [dash, setDash] = useState<SellerDashboardData | null>(null);
  const [period, setPeriod] = useState<"daily" | "weekly">("daily");
  const [verif, setVerif] = useState<SellerVerification | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [nid, setNid] = useState("");
  const [stall, setStall] = useState("");

  const load = () =>
    fetchMyProducts()
      .then(setListings)
      .catch(() => setListings([]))
      .finally(() => setLoading(false));

  const loadMeta = () => {
    getSellerAnalytics().then(setStats).catch(() => {});
    getSellerDashboard().then(setDash).catch(() => {});
    getSellerVerification().then(setVerif).catch(() => {});
    fetchMyPayouts().then(setPayouts).catch(() => {});
  };

  const doRetry = async (orderId: string) => {
    setRetrying(orderId);
    try {
      await retryPayout(orderId);
      await fetchMyPayouts().then(setPayouts);
    } catch {
      /* surfaced by the row's existing status */
    } finally {
      setRetrying(null);
    }
  };

  useEffect(() => {
    // Wrapped so no setState runs synchronously in the effect body.
    const run = async () => {
      if (!(isAuthenticated && user?.role === "seller")) {
        setLoading(false);
        return;
      }
      load();
      loadMeta();
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  const submitVerif = async () => {
    if (!nid.trim() || !stall.trim()) return;
    await submitSellerVerification(nid.trim(), stall.trim());
    loadMeta();
  };

  const derived = useMemo(() => {
    const daily = dash?.daily ?? [];
    const weekly = dash?.weekly ?? [];
    const products = dash?.products ?? [];
    const points =
      period === "daily"
        ? daily.map((d) => ({ label: d.date.slice(8, 10), sales: d.sales, tx: d.transactions }))
        : weekly.map((w) => ({ label: w.week.slice(5), sales: w.sales, tx: w.transactions }));
    const tx7d = daily.slice(-7).reduce((s, d) => s + d.transactions, 0);
    const unitsSold = products.reduce((s, p) => s + p.unitsSold, 0);
    const calendar: Record<string, number> = {};
    for (const d of daily) if (d.sales > 0) calendar[d.date] = d.sales;
    const cols = {
      inStock: products.filter((p) => p.stock > LOW_STOCK),
      lowStock: products.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK),
      outOfStock: products.filter((p) => p.stock <= 0),
    };
    return { points, tx7d, unitsSold, calendar, cols, products };
  }, [dash, period]);

  if (!isAuthenticated) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">
          {t("seller.loginPrompt")}
        </p>
        <Link to="/login" className="text-forest-800 underline">{t("seller.login")}</Link>
      </section>
    );
  }

  if (user?.role !== "seller") {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body">
          {t("seller.sellersOnly")}
        </p>
      </section>
    );
  }

  const toggleActive = async (p: Product) => {
    await updateProduct(p.id, { isActive: !p.isActive });
    load();
  };

  const remove = async (p: Product) => {
    if (confirm(t("seller.confirmDelete", { name: p.name }))) {
      await deleteProductApi(p.id);
      load();
    }
  };

  const sponsor = async (p: Product) => {
    await sponsorProduct(p.id, 7); // FR-30
    load();
  };

  const promo = async (p: Product) => {
    const pct = Number(prompt(t("seller.promoPrompt", { name: p.name }), "20"));
    if (!pct || pct <= 0 || pct >= 100) return;
    const end = new Date();
    end.setDate(end.getDate() + 30);
    await createPromotion({
      productId: p.id,
      discountType: "percent",
      value: pct,
      endDate: end.toISOString().slice(0, 10),
    }); // FR-20
    load();
  };

  const stockColumns: KanbanColumn[] = [
    {
      key: "in",
      title: t("dash.inStock"),
      accent: CHART_COLORS.LEAF,
      cards: derived.cols.inStock.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: t("dash.remaining", { qty: p.stock, unit: p.unit }),
        right: <span className="text-[11px] font-mono text-forest-500 shrink-0">{formatPrice(p.revenue)}</span>,
      })),
    },
    {
      key: "low",
      title: t("dash.lowStock"),
      accent: CHART_COLORS.CLAY,
      cards: derived.cols.lowStock.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: t("dash.remaining", { qty: p.stock, unit: p.unit }),
        badge: t("dash.sold", { qty: p.unitsSold }),
      })),
    },
    {
      key: "out",
      title: t("dash.outOfStock"),
      accent: "var(--color-forest-500)",
      cards: derived.cols.outOfStock.map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: t("dash.sold", { qty: p.unitsSold }),
      })),
    },
  ];

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

  const newListingBtn = (
    <Link
      to="/sell/new"
      className="flex items-center gap-1 bg-forest-800 text-cream px-3 py-1.5 rounded-md text-sm font-medium hover:bg-forest-950 transition"
    >
      <Plus size={16} /> <span className="hidden sm:inline">{t("seller.newListing")}</span>
    </Link>
  );

  return (
    <DashboardLayout title={t("seller.dashboardTitle")} nav={buildSellerNav(t)} actions={newListingBtn}>
      <div className="max-w-5xl mx-auto">
      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><TrendingUp size={14} /> {t("dash.netIncome")}</p>
          <p className="font-mono text-xl text-forest-950">{formatPrice(stats?.salesThisWeek ?? 0)}</p>
        </div>
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><Receipt size={14} /> {t("dash.transactions")}</p>
          <p className="font-mono text-xl text-forest-950">{derived.tx7d}</p>
        </div>
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><Boxes size={14} /> {t("dash.unitsSold")}</p>
          <p className="font-mono text-xl text-forest-950">{derived.unitsSold}</p>
        </div>
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><Package size={14} /> {t("seller.topProduct")}</p>
          <p className="font-body text-base text-forest-950 truncate">{stats?.topProducts[0]?.name ?? "—"}</p>
        </div>
      </div>

      {/* Sales + transactions graphs */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-body font-semibold text-forest-800">{t("dash.salesTrend")}</h2>
        {periodToggle}
      </div>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="text-xs text-forest-500 mb-2">{t("dash.revenue")}</p>
          <div className="overflow-x-auto">
            <BarChart data={derived.points.map((p) => ({ label: p.label, value: p.sales, hover: `${p.label}: ${formatPrice(p.sales)}` }))} format={(v) => formatPrice(v)} />
          </div>
        </div>
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="text-xs text-forest-500 mb-2">{t("dash.txTrend")}</p>
          <div className="overflow-x-auto">
            <BarChart data={derived.points.map((p) => ({ label: p.label, value: p.tx }))} color={CHART_COLORS.FOREST} />
          </div>
        </div>
      </div>

      {/* Stock Kanban + sales calendar */}
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2">
          <h2 className="font-body font-semibold text-forest-800 mb-3 flex items-center gap-1"><Boxes size={16} /> {t("dash.stockBoard")}</h2>
          <Kanban columns={stockColumns} />
        </div>
        <div>
          <h2 className="font-body font-semibold text-forest-800 mb-3 flex items-center gap-1"><CalendarDays size={16} /> {t("dash.salesCalendar")}</h2>
          <div className="receipt-stub bg-white border border-forest-300 p-4">
            <MiniCalendar values={derived.calendar} format={(v) => formatPrice(v)} />
          </div>
        </div>
      </div>

      {stats && stats.topProducts.length > 0 && (
        <div className="receipt-stub bg-white border border-forest-300 p-4 mb-8">
          <p className="text-xs text-forest-500 mb-2">{t("dash.productPerf")}</p>
          {stats.topProducts.map((p) => (
            <div key={p.name} className="flex justify-between text-sm py-0.5">
              <span className="text-forest-800">{t("seller.soldCount", { name: p.name, qty: p.qty })}</span>
              <span className="font-mono text-forest-950">{formatPrice(p.revenue)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Seller verification banner (FR-2/23) */}
      {verif && verif.status !== "verified" && (
        <div className="receipt-stub bg-white border border-clay/40 p-4 mb-6">
          <p className="flex items-center gap-1 text-sm font-medium text-forest-950 mb-1">
            <ShieldCheck size={16} className="text-clay" />
            {verif.status === "pending" && verif.nationalIdUrl
              ? t("seller.verifPending")
              : t("seller.verifPrompt")}
          </p>
          {!(verif.status === "pending" && verif.nationalIdUrl) && (
            <div className="grid sm:grid-cols-2 gap-2 mt-2">
              <input value={nid} onChange={(e) => setNid(e.target.value)}
                placeholder={t("seller.idLinkPlaceholder")}
                className="px-3 py-2 border border-forest-300 rounded-md text-sm" />
              <input value={stall} onChange={(e) => setStall(e.target.value)}
                placeholder={t("seller.stallLinkPlaceholder")}
                className="px-3 py-2 border border-forest-300 rounded-md text-sm" />
              <button onClick={submitVerif}
                className="sm:col-span-2 bg-forest-800 text-cream py-2 rounded-md text-sm font-medium hover:bg-forest-950 transition">
                {t("seller.submitVerif")}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Seller payouts / escrow settlement (FR-15) */}
      {payouts.length > 0 && (
        <div className="mb-8">
          <h2 className="font-body font-semibold text-forest-800 mb-3 flex items-center gap-1">
            <Wallet size={16} /> {t("seller.payoutsTitle")}
          </h2>
          <div className="flex flex-col gap-2">
            {payouts.map((po) => {
              const badge: Record<Payout["status"], { label: string; cls: string }> = {
                paid: { label: t("seller.poPaid"), cls: "bg-leaf/15 text-leaf" },
                pending: { label: t("seller.poPending"), cls: "bg-forest-300/30 text-forest-800" },
                failed: { label: t("seller.poFailed"), cls: "bg-clay/15 text-clay" },
                skipped: { label: t("seller.poNeedsAccount"), cls: "bg-clay/15 text-clay" },
              };
              const b = badge[po.status];
              return (
                <div
                  key={po.orderId}
                  className="receipt-stub bg-white border border-forest-300 p-3 flex items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-mono text-sm text-forest-950">
                      {formatPrice(po.amount)}
                      {po.commission > 0 && (
                        <span className="text-xs text-forest-500">
                          {t("seller.netCommission", { commission: formatPrice(po.commission) })}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-forest-500 truncate">
                      {po.provider ? `${po.provider} · ${po.momoNumber}` : t("seller.noWallet")}
                      {" · "}{t("seller.orderShort", { id: po.orderId.slice(0, 8) })}
                      {po.failureReason ? ` · ${po.failureReason}` : ""}
                    </p>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded ${b.cls}`}>{b.label}</span>
                  {(po.status === "failed" || po.status === "skipped") && (
                    <button
                      onClick={() => doRetry(po.orderId)}
                      disabled={retrying === po.orderId}
                      className="flex items-center gap-1 text-xs text-forest-800 hover:bg-forest-300/20 px-2 py-1 rounded-md disabled:opacity-50"
                      title={t("seller.retryTitle")}
                    >
                      <RefreshCw size={14} className={retrying === po.orderId ? "animate-spin" : ""} />
                      {t("common.retry")}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <h2 className="font-body font-semibold text-forest-800 mb-3">{t("seller.myListings")}</h2>

      {loading ? (
        <p className="text-forest-800/70 font-body py-8 text-center">{t("common.loading")}</p>
      ) : listings.length === 0 ? (
        <p className="text-forest-800/70 font-body py-8 text-center">
          {t("seller.noListings")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className={`receipt-stub bg-white border border-forest-300 p-4 flex items-center gap-4 ${
                !listing.isActive ? "opacity-50" : ""
              }`}
            >
              <img
                src={hasUsablePhoto(listing.photoUrl) ? listing.photoUrl : productImage(listing.name, listing.category, listing.id)}
                alt={listing.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-body font-semibold text-forest-950 flex items-center gap-2">
                  {listing.name}
                  {listing.sponsored && (
                    <span className="text-[10px] bg-forest-950/80 text-cream px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Megaphone size={10} /> {t("common.sponsored")}
                    </span>
                  )}
                  {listing.promoPrice != null && listing.promoPrice < listing.price && (
                    <span className="text-[10px] bg-clay/20 text-clay px-1.5 py-0.5 rounded">{t("seller.inPromo")}</span>
                  )}
                </p>
                <p className="font-mono text-sm text-forest-800">
                  {formatPrice(listing.price)} / {listing.unit}
                </p>
                <p className="text-xs text-forest-500">
                  {t("product.available", { qty: listing.quantityAvailable, unit: listing.unit })}
                  {!listing.isActive && t("seller.inactive")}
                </p>
              </div>
              <button
                onClick={() => promo(listing)}
                className="p-2 text-forest-800 hover:bg-forest-300/20 rounded-md"
                title={t("seller.createPromo")}
              >
                <Percent size={18} />
              </button>
              <button
                onClick={() => sponsor(listing)}
                className="p-2 text-forest-800 hover:bg-forest-300/20 rounded-md"
                title={t("seller.sponsor7")}
              >
                <Megaphone size={18} />
              </button>
              <button
                onClick={() => toggleActive(listing)}
                className="p-2 text-forest-800 hover:bg-forest-300/20 rounded-md"
                title={listing.isActive ? t("seller.deactivate") : t("seller.activate")}
              >
                {listing.isActive ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <Link
                to={`/sell/edit/${listing.id}`}
                className="p-2 text-forest-800 hover:bg-forest-300/20 rounded-md"
                title={t("seller.edit")}
              >
                <Pencil size={18} />
              </Link>
              <button
                onClick={() => remove(listing)}
                className="p-2 text-clay hover:bg-clay/10 rounded-md"
                title={t("common.delete")}
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
      </div>
    </DashboardLayout>
  );
}
