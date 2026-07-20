import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { buildSellerNav } from "../utils/sellerNav";
import { statusBadge } from "../utils/buyerDash";
import {
  fetchOrders,
  updateOrderStatus,
  listDeliveryAgents,
  assignDeliveryAgent,
  type SellerDeliveryAgent,
} from "../api/endpoints";
import type { Order } from "../types/order";
import { formatPrice } from "../utils/format";

// The seller's next status step (confirmed -> out_for_delivery -> delivered).
const NEXT_STATUS: Record<string, { to: string; labelKey: string }> = {
  confirmed: { to: "out_for_delivery", labelKey: "sellerOps.toOutForDelivery" },
  out_for_delivery: { to: "delivered", labelKey: "sellerOps.toDelivered" },
};

export default function SellerOrders() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const isSeller = user?.role === "seller";

  const [orders, setOrders] = useState<Order[]>([]);
  const [agents, setAgents] = useState<SellerDeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () =>
    fetchOrders("seller")
      .then((list) => setOrders([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    const run = async () => {
      if (!(isAuthenticated && isSeller)) {
        setLoading(false);
        return;
      }
      load();
      listDeliveryAgents().then(setAgents).catch(() => {});
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  if (!isAuthenticated) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">{t("seller.loginPrompt")}</p>
        <Link to="/login" className="text-forest-800 underline">{t("seller.login")}</Link>
      </section>
    );
  }
  if (!isSeller) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body">{t("seller.sellersOnly")}</p>
      </section>
    );
  }

  const advance = async (o: Order) => {
    const next = NEXT_STATUS[o.status];
    if (!next) return;
    setBusyId(o.id);
    try {
      await updateOrderStatus(o.id, next.to);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const assign = async (o: Order, agentId: string) => {
    if (!agentId) return;
    setBusyId(o.id);
    try {
      await assignDeliveryAgent(o.id, agentId);
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const canDeliver = (o: Order) => o.deliveryMode === "delivery";
  const active = (o: Order) => o.status === "confirmed" || o.status === "out_for_delivery";

  return (
    <DashboardLayout title={t("sellerOps.ordersTitle")} nav={buildSellerNav(t)}>
      <div className="max-w-4xl mx-auto">
        <p className="text-sm text-forest-500 mb-5">{t("sellerOps.ordersSubtitle")}</p>

        {loading ? (
          <p className="text-forest-800/70 font-body py-8 text-center">{t("common.loading")}</p>
        ) : orders.length === 0 ? (
          <p className="text-forest-800/70 font-body py-8 text-center">{t("sellerOps.noOrders")}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((o) => {
              const badge = statusBadge(o.status, t);
              const next = NEXT_STATUS[o.status];
              const firstItem = o.items?.[0]?.productName ?? "—";
              return (
                <div key={o.id} className="receipt-stub bg-white border border-forest-300 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="font-body font-semibold text-forest-950 truncate">{firstItem}</p>
                      <p className="text-xs text-forest-500">
                        {t("sellerOps.thBuyer")}: {o.buyerName ?? "—"} · {o.createdAt.slice(0, 10)}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm text-forest-950">{formatPrice(o.totalAmount)}</p>
                      <span className={`text-[11px] px-2 py-0.5 rounded ${badge.cls}`}>{badge.label}</span>
                    </div>
                  </div>

                  {canDeliver(o) && active(o) && (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-forest-300/50">
                      {/* Assign a delivery agent */}
                      <select
                        value={o.deliveryAgentId ?? ""}
                        onChange={(e) => assign(o, e.target.value)}
                        disabled={busyId === o.id || agents.length === 0}
                        className="px-3 py-1.5 border border-forest-300 rounded-md text-sm bg-white disabled:opacity-50"
                      >
                        <option value="">{t("sellerOps.unassigned")}</option>
                        {agents.map((a) => (
                          <option key={a.id} value={a.id}>{a.fullName}</option>
                        ))}
                      </select>
                      {agents.length === 0 && (
                        <Link to="/sell/agents" className="text-xs text-forest-800 underline">
                          {t("sellerOps.addAgent")}
                        </Link>
                      )}

                      {/* Advance status */}
                      {next && (
                        <button
                          onClick={() => advance(o)}
                          disabled={busyId === o.id}
                          className="ml-auto bg-forest-800 text-cream px-3 py-1.5 rounded-md text-sm font-medium hover:bg-forest-950 transition disabled:opacity-50"
                        >
                          {t(next.labelKey)}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
