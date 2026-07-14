import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, FileCheck, Copy, Star, BarChart3, UserCheck, Wallet, RefreshCw } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/format";
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
  retryPayout,
  type FlaggedReview,
  type OriginDoc,
  type DuplicateFlag,
  type MarketInsights,
  type PendingSeller,
  type AdminPayout,
  type PayoutSummary,
} from "../api/endpoints";

export default function Admin() {
  const { user, isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState<FlaggedReview[]>([]);
  const [docs, setDocs] = useState<OriginDoc[]>([]);
  const [dups, setDups] = useState<DuplicateFlag[]>([]);
  const [insights, setInsights] = useState<MarketInsights | null>(null);
  const [sellers, setSellers] = useState<PendingSeller[]>([]);
  const [payouts, setPayouts] = useState<AdminPayout[]>([]);
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);

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

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  if (!isAuthenticated || user?.role !== "admin") {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-3">Accès réservé aux administrateurs.</p>
        <Link to="/admin/login" className="text-forest-800 underline">Portail administrateur</Link>
      </section>
    );
  }

  const card = "receipt-stub bg-white border border-forest-300 p-4";

  return (
    <section className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl text-forest-950 mb-1 flex items-center gap-2">
        <ShieldAlert size={22} /> Console de modération
      </h1>
      <p className="text-xs text-forest-500 mb-6">
        Signaux automatiques — la décision finale vous revient (NFR-16).
      </p>

      {/* Market insights (FR-31) */}
      {insights && (
        <>
          <h2 className="font-body font-semibold text-forest-800 mb-2 flex items-center gap-1">
            <BarChart3 size={16} /> Tendances du marché (anonymisées)
          </h2>
          <div className="grid grid-cols-4 gap-2 mb-4">
            <div className="receipt-stub bg-white border border-forest-300 p-3">
              <p className="text-[11px] text-forest-500">Volume (GMV)</p>
              <p className="font-mono text-sm text-forest-950">{formatPrice(insights.totalGMV)}</p>
            </div>
            <div className="receipt-stub bg-white border border-forest-300 p-3">
              <p className="text-[11px] text-forest-500">Commandes</p>
              <p className="font-mono text-sm text-forest-950">{insights.orderCount}</p>
            </div>
            <div className="receipt-stub bg-white border border-forest-300 p-3">
              <p className="text-[11px] text-forest-500">Vendeurs actifs</p>
              <p className="font-mono text-sm text-forest-950">{insights.activeSellers}</p>
            </div>
            <div className="receipt-stub bg-white border border-forest-300 p-3">
              <p className="text-[11px] text-forest-500">Acheteurs actifs</p>
              <p className="font-mono text-sm text-forest-950">{insights.activeBuyers}</p>
            </div>
          </div>
          {insights.categories.length > 0 && (
            <div className="receipt-stub bg-white border border-forest-300 p-4 mb-8">
              <p className="text-xs text-forest-500 mb-2">Par catégorie</p>
              {insights.categories.map((c) => (
                <div key={c.category} className="flex justify-between text-sm py-0.5">
                  <span className="text-forest-800">{c.category} · prix moyen {formatPrice(c.avgPrice)}</span>
                  <span className="font-mono text-forest-950">{formatPrice(c.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Seller payouts (FR-15 settlement) */}
      {payoutSummary && (
        <>
          <h2 className="font-body font-semibold text-forest-800 mb-2 flex items-center gap-1">
            <Wallet size={16} /> Versements vendeurs
          </h2>
          <div className="grid grid-cols-4 gap-2 mb-4">
            {([
              ["paid", "Versés", "text-leaf"],
              ["pending", "En cours", "text-forest-800"],
              ["failed", "Échoués", "text-clay"],
              ["skipped", "À réclamer", "text-clay"],
            ] as const).map(([key, label, cls]) => (
              <div key={key} className="receipt-stub bg-white border border-forest-300 p-3">
                <p className="text-[11px] text-forest-500">{label}</p>
                <p className={`font-mono text-sm ${cls}`}>{formatPrice(payoutSummary[key].amount)}</p>
                <p className="text-[11px] text-forest-500">{payoutSummary[key].count} versement(s)</p>
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
                        {p.provider ? `${p.provider} · ${p.momoNumber}` : "Aucun compte lié"}
                        {" · "}Cmd {p.orderId.slice(0, 8)}
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
                      {p.status}
                    </span>
                    {(p.status === "failed" || p.status === "skipped") && (
                      <button
                        onClick={() => doRetry(p.orderId)}
                        disabled={retrying === p.orderId}
                        className="flex items-center gap-1 text-xs text-forest-800 hover:bg-forest-300/20 px-2 py-1 rounded-md disabled:opacity-50"
                      >
                        <RefreshCw size={14} className={retrying === p.orderId ? "animate-spin" : ""} />
                        Réessayer
                      </button>
                    )}
                  </div>
                ))}
              {payouts.every((p) => p.status === "paid") && (
                <p className="text-sm text-forest-500">Tous les versements sont à jour.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Seller verification (FR-2/23) */}
      <h2 className="font-body font-semibold text-forest-800 mb-2 flex items-center gap-1">
        <UserCheck size={16} /> Vérifications vendeurs ({sellers.length})
      </h2>
      <div className="flex flex-col gap-3 mb-8">
        {sellers.length === 0 && <p className="text-sm text-forest-500">Aucune demande en attente.</p>}
        {sellers.map((s) => (
          <div key={s.userId} className="receipt-stub bg-white border border-forest-300 p-4">
            <p className="text-sm font-medium text-forest-950">{s.fullName} · {s.marketName ?? "—"}</p>
            <div className="flex gap-3 my-1 text-[11px]">
              {s.nationalIdUrl && <a href={s.nationalIdUrl} target="_blank" rel="noreferrer" className="text-forest-800 underline">Pièce d'identité</a>}
              {s.stallPhotoUrl && <a href={s.stallPhotoUrl} target="_blank" rel="noreferrer" className="text-forest-800 underline">Photo de l'étal</a>}
            </div>
            <div className="flex gap-2 mt-1">
              <button onClick={() => adminVerifySeller(s.userId, "verified").then(load)}
                className="text-sm bg-forest-800 text-cream px-3 py-1.5 rounded-md hover:bg-forest-950">Vérifier</button>
              <button onClick={() => adminVerifySeller(s.userId, "rejected").then(load)}
                className="text-sm border border-clay text-clay px-3 py-1.5 rounded-md hover:bg-clay/10">Rejeter</button>
            </div>
          </div>
        ))}
      </div>

      {/* Reviews (FR-39/40) */}
      <h2 className="font-body font-semibold text-forest-800 mb-2 flex items-center gap-1">
        <Star size={16} /> Avis signalés ({reviews.length})
      </h2>
      <div className="flex flex-col gap-3 mb-8">
        {reviews.length === 0 && <p className="text-sm text-forest-500">Aucun avis en attente.</p>}
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
              <p className="text-[11px] text-forest-500 mb-2">{r.evidence.length} photo(s) jointe(s)</p>
            )}
            <div className="flex gap-2">
              <button onClick={() => adminResolveReview(r.id, "publish").then(load)}
                className="text-sm bg-forest-800 text-cream px-3 py-1.5 rounded-md hover:bg-forest-950">Publier</button>
              <button onClick={() => adminResolveReview(r.id, "remove").then(load)}
                className="text-sm border border-clay text-clay px-3 py-1.5 rounded-md hover:bg-clay/10">Retirer</button>
            </div>
          </div>
        ))}
      </div>

      {/* Origin documents (FR-42) */}
      <h2 className="font-body font-semibold text-forest-800 mb-2 flex items-center gap-1">
        <FileCheck size={16} /> Documents d'origine ({docs.length})
      </h2>
      <div className="flex flex-col gap-3 mb-8">
        {docs.length === 0 && <p className="text-sm text-forest-500">Aucun document en attente.</p>}
        {docs.map((d) => (
          <div key={d.id} className={card}>
            <p className="text-sm text-forest-950 mb-1">
              « {d.claim} » — {d.productName} · {d.sellerName}
            </p>
            <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-[11px] text-forest-800 underline">
              {d.documentType ?? "document"} joint
            </a>
            <div className="flex gap-2 mt-2">
              <button onClick={() => adminVerifyOrigin(d.id, "verified").then(load)}
                className="text-sm bg-forest-800 text-cream px-3 py-1.5 rounded-md hover:bg-forest-950">Documentation vérifiée</button>
              <button onClick={() => adminVerifyOrigin(d.id, "rejected").then(load)}
                className="text-sm border border-clay text-clay px-3 py-1.5 rounded-md hover:bg-clay/10">Rejeter</button>
            </div>
          </div>
        ))}
      </div>

      {/* Duplicate images (FR-43) */}
      <h2 className="font-body font-semibold text-forest-800 mb-2 flex items-center gap-1">
        <Copy size={16} /> Images en double ({dups.length})
      </h2>
      <div className="flex flex-col gap-3">
        {dups.length === 0 && <p className="text-sm text-forest-500">Aucun doublon détecté.</p>}
        {dups.map((d) => (
          <div key={d.productId} className={card}>
            <p className="text-sm text-forest-950 mb-1">
              « {d.productName} » ({d.sellerName}) réutilise l'image de « {d.matchedProductName} » ({d.matchedSeller})
            </p>
            <div className="flex gap-2 mt-1">
              <button onClick={() => adminResolveDuplicate(d.productId, "clear").then(load)}
                className="text-sm border border-forest-300 text-forest-800 px-3 py-1.5 rounded-md hover:bg-forest-300/20">Ignorer</button>
              <button onClick={() => adminResolveDuplicate(d.productId, "remove").then(load)}
                className="text-sm border border-clay text-clay px-3 py-1.5 rounded-md hover:bg-clay/10">Retirer l'annonce</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
