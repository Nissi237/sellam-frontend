import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShieldAlert, FileCheck, Copy, Star, BarChart3, UserCheck, Wallet, RefreshCw, Users, Package, ShoppingBag, Coins, CalendarDays, Table as TableIcon, Activity, Ban, RotateCcw, Trash2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/format";
import NotificationsBell from "../components/NotificationsBell";
import { LineChart, BarChart, CHART_COLORS } from "../components/charts";
import Kanban, { type KanbanColumn } from "../components/Kanban";
import MiniCalendar from "../components/MiniCalendar";
import {
  adminListReviews,
  adminResolveReview,
  adminListOriginDocs,
  adminVerifyOrigin,
  adminListDuplicates,
  adminResolveDuplicate,
  getMarketInsights,
  adminListSellers,
  adminVerifySeller,
  adminListPayouts,
  adminListAccounts,
  adminGetProgression,
  adminGetAccountActivity,
  adminSuspendAccount,
  adminReinstateAccount,
  adminDeleteAccount,
  retryPayout,
  type FlaggedReview,
  type OriginDoc,
  type DuplicateFlag,
  type MarketInsights,
  type PendingSeller,
  type AdminPayout,
  type PayoutSummary,
  type AccountsResponse,
  type Progression,
  type Account,
  type AccountActivity,
} from "../api/endpoints";

export default function Admin() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<FlaggedReview[]>([]);
  const [docs, setDocs] = useState<OriginDoc[]>([]);
  const [dups, setDups] = useState<DuplicateFlag[]>([]);
  const [insights, setInsights] = useState<MarketInsights | null>(null);
  const [sellers, setSellers] = useState<PendingSeller[]>([]);
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [accounts, setAccounts] = useState<AccountsResponse | null>(null);
  const [progression, setProgression] = useState<Progression | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [acctBusy, setAcctBusy] = useState<string | null>(null);
  const [activity, setActivity] = useState<AccountActivity | null>(null);

  const loadPayouts = () =>
    adminListPayouts()
      .then((d) => {
        setPayouts(d.payouts);
        setPayoutSummary(d.summary);
      })
      .catch(() => {});

  const load = () => {
    adminListReviews().then(setReviews).catch(() => {});
    adminListOriginDocs().then(setDocs).catch(() => {});
    adminListDuplicates().then(setDups).catch(() => {});
    getMarketInsights().then(setInsights).catch(() => {});
    adminListSellers().then(setSellers).catch(() => {});
    adminListAccounts().then(setAccounts).catch(() => {});
    adminGetProgression().then(setProgression).catch(() => {});
    loadPayouts();
  };

  const doRetry = async (orderId: string) => {
    setRetrying(orderId);
    try {
      await retryPayout(orderId);
      await loadPayouts();
    } catch {
      /* status stays as-is */
    } finally {
      setRetrying(null);
    }
  };

  // ---- Account control ----
  const viewActivity = async (a: Account) => {
    setAcctBusy(a.id);
    try {
      setActivity(await adminGetAccountActivity(a.id));
    } catch {
      /* ignore */
    } finally {
      setAcctBusy(null);
    }
  };

  const suspend = async (a: Account) => {
    const reason = prompt(t("adminAcct.suspendReason"), "");
    if (reason === null) return;
    setAcctBusy(a.id);
    try {
      await adminSuspendAccount(a.id, reason);
      adminListAccounts().then(setAccounts).catch(() => {});
    } finally {
      setAcctBusy(null);
    }
  };

  const reinstate = async (a: Account) => {
    setAcctBusy(a.id);
    try {
      await adminReinstateAccount(a.id);
      adminListAccounts().then(setAccounts).catch(() => {});
    } finally {
      setAcctBusy(null);
    }
  };

  const removeAccount = async (a: Account) => {
    if (!confirm(t("adminAcct.confirmDelete", { name: a.fullName }))) return;
    setAcctBusy(a.id);
    try {
      await adminDeleteAccount(a.id);
      adminListAccounts().then(setAccounts).catch(() => {});
    } finally {
      setAcctBusy(null);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  const growth = useMemo(() => {
    const signups = progression?.signups ?? [];
    const orders = progression?.orders ?? [];
    const labels = signups.map((s) => s.date.slice(5)); // MM-DD
    const calendar: Record<string, number> = {};
    for (const s of signups) {
      const total = s.buyers + s.sellers;
      if (total > 0) calendar[s.date] = total;
    }
    return {
      labels,
      buyers: signups.map((s) => s.buyers),
      sellers: signups.map((s) => s.sellers),
      orderLabels: orders.map((o) => o.date.slice(5)),
      orderCounts: orders.map((o) => o.orders),
      calendar,
    };
  }, [progression]);

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-3">{t("admin.accessRestricted")}</p>
        <Link to="/admin/login" className="text-forest-800 underline">{t("admin.portalLink")}</Link>
      </section>
    );
  }

  const card = "receipt-stub bg-white border border-forest-300 p-4";

  const moderationColumns: KanbanColumn[] = [
    {
      key: "verify",
      title: t("dash.colVerify"),
      accent: CHART_COLORS.CLAY,
      cards: sellers.map((s) => ({ id: s.userId, title: s.fullName, subtitle: s.marketName ?? "—", badge: t("admin.verify") })),
    },
    {
      key: "reviews",
      title: t("dash.colReviews"),
      accent: "var(--color-forest-800)",
      cards: reviews.map((r) => ({ id: r.id, title: `${r.rating}★ ${r.buyerName}`, subtitle: r.reasons.join(", ") })),
    },
    {
      key: "docs",
      title: t("dash.colDocs"),
      accent: "var(--color-forest-500)",
      cards: docs.map((d) => ({ id: d.id, title: d.productName, subtitle: d.sellerName })),
    },
    {
      key: "dup",
      title: t("dash.colDup"),
      accent: CHART_COLORS.LEAF,
      cards: dups.map((d) => ({ id: d.productId, title: d.productName, subtitle: d.sellerName })),
    },
  ];

  const roleBadge: Record<string, string> = {
    seller: "bg-leaf/15 text-leaf",
    individual_buyer: "bg-forest-300/40 text-forest-800",
    corporate_buyer: "bg-clay/15 text-clay",
    admin: "bg-forest-950/80 text-cream",
    delivery_agent: "bg-forest-300/40 text-forest-800",
  };

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-1">
        <h1 className="font-display text-2xl text-forest-950 flex items-center gap-2">
          <ShieldAlert size={22} /> {t("admin.consoleTitle")}
        </h1>
        <NotificationsBell />
      </div>
      <p className="text-xs text-forest-500 mb-6">{t("admin.consoleSubtitle")}</p>

      {/* Platform KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><Users size={14} /> {t("dash.totalUsers")}</p>
          <p className="font-mono text-xl text-forest-950">{progression?.totals.users ?? accounts?.total ?? 0}</p>
        </div>
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><Package size={14} /> {t("dash.totalProducts")}</p>
          <p className="font-mono text-xl text-forest-950">{progression?.totals.products ?? 0}</p>
        </div>
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><ShoppingBag size={14} /> {t("dash.totalOrders")}</p>
          <p className="font-mono text-xl text-forest-950">{progression?.totals.orders ?? 0}</p>
        </div>
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="flex items-center gap-1 text-xs text-forest-500 mb-1"><Coins size={14} /> {t("dash.gmvTotal")}</p>
          <p className="font-mono text-xl text-forest-950">{formatPrice(progression?.totals.gmv ?? 0)}</p>
        </div>
      </div>

      {/* Platform growth graphs */}
      <h2 className="font-body font-semibold text-forest-800 mb-3 flex items-center gap-1">
        <BarChart3 size={16} /> {t("dash.appProgression")}
      </h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-forest-500">{t("dash.signups")}</p>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_COLORS.LEAF }} /> {t("dash.buyers")}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: CHART_COLORS.CLAY }} /> {t("dash.sellers")}</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <LineChart
              labels={growth.labels}
              series={[
                { name: t("dash.buyers"), color: CHART_COLORS.LEAF, values: growth.buyers },
                { name: t("dash.sellers"), color: CHART_COLORS.CLAY, values: growth.sellers },
              ]}
            />
          </div>
        </div>
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="text-xs text-forest-500 mb-2">{t("dash.ordersTrend")}</p>
          <div className="overflow-x-auto">
            <BarChart data={growth.orderLabels.map((l, i) => ({ label: l, value: growth.orderCounts[i] }))} color={CHART_COLORS.FOREST} />
          </div>
        </div>
      </div>

      {/* Moderation Kanban + new-accounts calendar */}
      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2">
          <h2 className="font-body font-semibold text-forest-800 mb-3 flex items-center gap-1"><ShieldAlert size={16} /> {t("dash.moderation")}</h2>
          <Kanban columns={moderationColumns} />
        </div>
        <div>
          <h2 className="font-body font-semibold text-forest-800 mb-3 flex items-center gap-1"><CalendarDays size={16} /> {t("dash.newAccountsCal")}</h2>
          <div className="receipt-stub bg-white border border-forest-300 p-4">
            <MiniCalendar values={growth.calendar} format={(v) => t("dash.actNsignups", { n: v })} />
          </div>
        </div>
      </div>

      {/* All accounts */}
      {accounts && (
        <div className="mb-8">
          <h2 className="font-body font-semibold text-forest-800 mb-3 flex items-center gap-1">
            <TableIcon size={16} /> {t("dash.accountsTitle", { count: accounts.total })}
          </h2>
          <div className="receipt-stub bg-white border border-forest-300 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] text-forest-500 border-b border-forest-300">
                  <th className="px-3 py-2 font-medium">{t("dash.name")}</th>
                  <th className="px-3 py-2 font-medium">{t("dash.role")}</th>
                  <th className="px-3 py-2 font-medium">{t("adminAcct.status")}</th>
                  <th className="px-3 py-2 font-medium">{t("dash.contact")}</th>
                  <th className="px-3 py-2 font-medium text-right">{t("dash.activity")}</th>
                  <th className="px-3 py-2 font-medium text-right">{t("adminAcct.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {accounts.accounts.map((a) => {
                  const suspended = a.status === "suspended";
                  const isAdmin = a.role === "admin";
                  const isSelf = a.id === user?.id;
                  return (
                    <tr key={a.id} className="border-b border-forest-300/40 last:border-0">
                      <td className="px-3 py-2 text-forest-950">{a.fullName}</td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${roleBadge[a.role] ?? "bg-forest-300/40 text-forest-800"}`}>
                          {t(`role.${a.role}`, a.role)}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${suspended ? "bg-clay/15 text-clay" : "bg-leaf/15 text-leaf"}`}>
                          {t(suspended ? "adminAcct.suspended" : "adminAcct.active")}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-forest-800/80 font-mono text-xs">{a.phone || a.email || "—"}</td>
                      <td className="px-3 py-2 text-right text-xs text-forest-500">
                        {a.role === "seller"
                          ? t("dash.actNorders", { n: a.ordersAsSeller })
                          : t("dash.actNorders", { n: a.ordersAsBuyer })}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => viewActivity(a)} disabled={acctBusy === a.id}
                            title={t("adminAcct.viewActivity")}
                            className="p-1.5 text-forest-800 hover:bg-forest-300/20 rounded disabled:opacity-50">
                            <Activity size={15} />
                          </button>
                          {!isAdmin && !isSelf && (
                            <>
                              {suspended ? (
                                <button onClick={() => reinstate(a)} disabled={acctBusy === a.id}
                                  title={t("adminAcct.reinstate")}
                                  className="p-1.5 text-leaf hover:bg-leaf/10 rounded disabled:opacity-50">
                                  <RotateCcw size={15} />
                                </button>
                              ) : (
                                <button onClick={() => suspend(a)} disabled={acctBusy === a.id}
                                  title={t("adminAcct.suspend")}
                                  className="p-1.5 text-clay hover:bg-clay/10 rounded disabled:opacity-50">
                                  <Ban size={15} />
                                </button>
                              )}
                              <button onClick={() => removeAccount(a)} disabled={acctBusy === a.id}
                                title={t("adminAcct.delete")}
                                className="p-1.5 text-clay hover:bg-clay/10 rounded disabled:opacity-50">
                                <Trash2 size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sales by category (FR-31) */}
      {insights && insights.categories.length > 0 && (
        <div className="receipt-stub bg-white border border-forest-300 p-4 mb-8">
          <p className="text-xs text-forest-500 mb-2">{t("admin.byCategory")}</p>
          {insights.categories.map((c) => (
            <div key={c.category} className="flex justify-between text-sm py-0.5">
              <span className="text-forest-800">{t("admin.avgPriceLine", { category: c.category, price: formatPrice(c.avgPrice) })}</span>
              <span className="font-mono text-forest-950">{formatPrice(c.revenue)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Seller payouts (FR-15 settlement) */}
      {payoutSummary && (
        <>
          <h2 className="font-body font-semibold text-forest-800 mb-2 flex items-center gap-1">
            <Wallet size={16} /> {t("admin.payoutsTitle")}
          </h2>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {([
              ["paid", "text-leaf"],
              ["pending", "text-forest-800"],
              ["failed", "text-clay"],
              ["skipped", "text-clay"],
            ] as const).map(([key, cls]) => (
              <div key={key} className="receipt-stub bg-white border border-forest-300 p-3">
                <p className="text-[11px] text-forest-500">{t(`admin.${key}`)}</p>
                <p className={`font-mono text-sm ${cls}`}>{formatPrice(payoutSummary[key].amount)}</p>
                <p className="text-[11px] text-forest-500">{t("admin.payoutCount", { count: payoutSummary[key].count })}</p>
              </div>
            ))}
          </div>
          {payouts.length > 0 && (
            <div className="flex flex-col gap-2 mb-8">
              {payouts
                .filter((p) => p.status === "failed" || p.status === "pending" || p.status === "skipped")
                .slice(0, 15)
                .map((p) => (
                  <div key={p.orderId} className="receipt-stub bg-white border border-forest-300 p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-sm text-forest-950">
                        {formatPrice(p.amount)} <span className="text-xs text-forest-500">→ {p.sellerName}</span>
                      </p>
                      <p className="text-xs text-forest-500 truncate">
                        {p.provider ? `${p.provider} · ${p.momoNumber}` : t("admin.noWallet")}
                        {" · "}{t("admin.orderShort", { id: p.orderId.slice(0, 8) })}
                        {p.failureReason ? ` · ${p.failureReason}` : ""}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded ${
                        p.status === "failed" || p.status === "skipped"
                          ? "bg-clay/15 text-clay"
                          : "bg-forest-300/30 text-forest-800"
                      }`}
                    >
                      {t(`admin.st.${p.status}`)}
                    </span>
                    {(p.status === "failed" || p.status === "skipped") && (
                      <button
                        onClick={() => doRetry(p.orderId)}
                        disabled={retrying === p.orderId}
                        className="flex items-center gap-1 text-xs text-forest-800 hover:bg-forest-300/20 px-2 py-1 rounded-md disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={retrying === p.orderId ? "animate-spin" : ""} />
                        {t("common.retry")}
                      </button>
                    )}
                  </div>
                ))}
              {payouts.every((p) => p.status === "paid") && (
                <p className="text-sm text-forest-500">{t("admin.payoutsUpToDate")}</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Seller verification (FR-2/23) */}
      <h2 className="font-body font-semibold text-forest-800 mb-2 flex items-center gap-1">
        <UserCheck size={16} /> {t("admin.verifTitle", { count: sellers.length })}
      </h2>
      <div className="flex flex-col gap-3 mb-8">
        {sellers.length === 0 && <p className="text-sm text-forest-500">{t("admin.noPending")}</p>}
        {sellers.map((s) => (
          <div key={s.userId} className="receipt-stub bg-white border border-forest-300 p-4">
            <p className="text-sm font-medium text-forest-950">{s.fullName} · {s.marketName ?? "—"}</p>
            <div className="flex gap-3 my-1 text-[11px]">
              {s.nationalIdUrl && <a href={s.nationalIdUrl} target="_blank" rel="noreferrer" className="text-forest-800 underline">{t("admin.nationalId")}</a>}
              {s.stallPhotoUrl && <a href={s.stallPhotoUrl} target="_blank" rel="noreferrer" className="text-forest-800 underline">{t("admin.stallPhoto")}</a>}
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={() => adminVerifySeller(s.userId, "verified").then(load)}
                className="text-sm bg-forest-800 text-cream px-3 py-1.5 rounded-md hover:bg-forest-950">{t("admin.verify")}</button>
              <button onClick={() => adminVerifySeller(s.userId, "rejected").then(load)}
                className="text-sm border border-clay text-clay px-3 py-1.5 rounded-md hover:bg-clay/10">{t("admin.reject")}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Reviews (FR-39/40) */}
      <h2 className="font-body font-semibold text-forest-800 mb-2 flex items-center gap-1">
        <Star size={16} /> {t("admin.reviewsTitle", { count: reviews.length })}
      </h2>
      <div className="flex flex-col gap-3 mb-8">
        {reviews.length === 0 && <p className="text-sm text-forest-500">{t("admin.noReviews")}</p>}
        {reviews.map((r) => (
          <div key={r.id} className={card}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-forest-950">
                {r.rating}★ · {r.buyerName} → {r.sellerName}
              </span>
              <span className="text-[11px] font-mono text-clay">{r.reasons.join(", ")}</span>
            </div>
            {r.comment && <p className="text-sm text-forest-800/80 mb-2">{r.comment}</p>}
            {r.evidence.length > 0 && (
              <p className="text-[11px] text-forest-500 mb-2">{t("admin.photosAttached", { count: r.evidence.length })}</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => adminResolveReview(r.id, "publish").then(load)}
                className="text-sm bg-forest-800 text-cream px-3 py-1.5 rounded-md hover:bg-forest-950">{t("admin.publish")}</button>
              <button onClick={() => adminResolveReview(r.id, "remove").then(load)}
                className="text-sm border border-clay text-clay px-3 py-1.5 rounded-md hover:bg-clay/10">{t("admin.remove")}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Origin documents (FR-42) */}
      <h2 className="font-body font-semibold text-forest-800 mb-2 flex items-center gap-1">
        <FileCheck size={16} /> {t("admin.originTitle", { count: docs.length })}
      </h2>
      <div className="flex flex-col gap-3 mb-8">
        {docs.length === 0 && <p className="text-sm text-forest-500">{t("admin.noDocs")}</p>}
        {docs.map((d) => (
          <div key={d.id} className={card}>
            <p className="text-sm text-forest-950 mb-1">
              « {d.claim} » — {d.productName} · {d.sellerName}
            </p>
            <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-[11px] text-forest-800 underline">
              {t("admin.attached", { type: d.documentType ?? "document" })}
            </a>
            <div className="flex gap-2 mt-2">
              <button onClick={() => adminVerifyOrigin(d.id, "verified").then(load)}
                className="text-sm bg-forest-800 text-cream px-3 py-1.5 rounded-md hover:bg-forest-950">{t("admin.docVerified")}</button>
              <button onClick={() => adminVerifyOrigin(d.id, "rejected").then(load)}
                className="text-sm border border-clay text-clay px-3 py-1.5 rounded-md hover:bg-clay/10">{t("admin.reject")}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Duplicate images (FR-43) */}
      <h2 className="font-body font-semibold text-forest-800 mb-2 flex items-center gap-1">
        <Copy size={16} /> {t("admin.duplicatesTitle", { count: dups.length })}
      </h2>
      <div className="flex flex-col gap-3">
        {dups.length === 0 && <p className="text-sm text-forest-500">{t("admin.noDuplicates")}</p>}
        {dups.map((d) => (
          <div key={d.productId} className={card}>
            <p className="text-sm text-forest-950 mb-1">
              {t("admin.duplicateLine", { product: d.productName, seller: d.sellerName, matched: d.matchedProductName, matchedSeller: d.matchedSeller })}
            </p>
            <div className="flex gap-2 mt-1">
              <button onClick={() => adminResolveDuplicate(d.productId, "clear").then(load)}
                className="text-sm border border-forest-300 text-forest-800 px-3 py-1.5 rounded-md hover:bg-forest-300/20">{t("admin.ignore")}</button>
              <button onClick={() => adminResolveDuplicate(d.productId, "remove").then(load)}
                className="text-sm border border-clay text-clay px-3 py-1.5 rounded-md hover:bg-clay/10">{t("admin.removeListing")}</button>
            </div>
          </div>
        ))}
      </div>

      {/* Account activity modal (sales + transactions, no personal payment info) */}
      {activity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog">
          <div className="absolute inset-0 bg-forest-950/50" onClick={() => setActivity(null)} />
          <div className="relative bg-white receipt-stub border border-forest-300 w-full max-w-2xl max-h-[85vh] overflow-y-auto p-5">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-display text-lg text-forest-950">
                {t("adminAcct.activityTitle", { name: activity.account.fullName })}
              </h3>
              <button onClick={() => setActivity(null)} className="p-1 text-forest-800 hover:bg-forest-300/20 rounded" title={t("adminAcct.close")}>
                <X size={18} />
              </button>
            </div>
            <p className="text-[11px] text-forest-500 mb-4">{t("adminAcct.privacyNote")}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="receipt-stub bg-cream/50 border border-forest-300 p-3">
                <p className="text-xs text-forest-500">{t("adminAcct.salesTotal")}</p>
                <p className="font-mono text-lg text-forest-950">{formatPrice(activity.summary.salesTotal)}</p>
                <p className="text-[11px] text-forest-500">{t("adminAcct.salesOrders", { n: activity.summary.salesOrders })}</p>
              </div>
              <div className="receipt-stub bg-cream/50 border border-forest-300 p-3">
                <p className="text-xs text-forest-500">{t("adminAcct.purchaseTotal")}</p>
                <p className="font-mono text-lg text-forest-950">{formatPrice(activity.summary.purchaseTotal)}</p>
                <p className="text-[11px] text-forest-500">{t("adminAcct.purchaseOrders", { n: activity.summary.purchaseOrders })}</p>
              </div>
            </div>

            {activity.transactions.length === 0 ? (
              <p className="text-sm text-forest-500 py-4 text-center">{t("adminAcct.noTxns")}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-[11px] text-forest-500 border-b border-forest-300">
                      <th className="px-2 py-1.5 font-medium">{t("adminAcct.thWhen")}</th>
                      <th className="px-2 py-1.5 font-medium">{t("adminAcct.thSide")}</th>
                      <th className="px-2 py-1.5 font-medium">{t("adminAcct.thCounterparty")}</th>
                      <th className="px-2 py-1.5 font-medium text-right">{t("adminAcct.thAmount")}</th>
                      <th className="px-2 py-1.5 font-medium">{t("adminAcct.thStatus")}</th>
                      <th className="px-2 py-1.5 font-medium">{t("adminAcct.thPayment")}</th>
                      <th className="px-2 py-1.5 font-medium">{t("adminAcct.thRef")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activity.transactions.map((x) => (
                      <tr key={x.orderId} className="border-b border-forest-300/40 last:border-0">
                        <td className="px-2 py-1.5 text-forest-500 whitespace-nowrap">{x.createdAt.slice(0, 10)}</td>
                        <td className="px-2 py-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${x.side === "seller" ? "bg-leaf/15 text-leaf" : "bg-forest-300/40 text-forest-800"}`}>
                            {t(x.side === "seller" ? "adminAcct.sideSeller" : "adminAcct.sideBuyer")}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-forest-800 truncate max-w-[120px]">{x.counterparty}</td>
                        <td className="px-2 py-1.5 text-right font-mono text-forest-950 whitespace-nowrap">{formatPrice(x.amount)}</td>
                        <td className="px-2 py-1.5 text-forest-800">{x.status}</td>
                        <td className="px-2 py-1.5 text-forest-500">{x.paymentProvider ?? "—"}{x.paymentStatus ? ` · ${x.paymentStatus}` : ""}</td>
                        <td className="px-2 py-1.5 font-mono text-[10px] text-forest-500">{x.transactionRef ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
