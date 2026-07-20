import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { OrdersTable } from "./BuyerDashboard";
import { buildBuyerNav } from "../utils/buyerDash";
import { fetchOrders } from "../api/endpoints";
import type { Order } from "../types/order";

export default function BuyerOrders() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const isBuyer = user?.role === "individual_buyer" || user?.role === "corporate_buyer";

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      if (!(isAuthenticated && isBuyer)) {
        setLoading(false);
        return;
      }
      try {
        const list = await fetchOrders("buyer");
        // newest first
        setOrders([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

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

  return (
    <DashboardLayout title={t("buyerDash.allOrders")} nav={buildBuyerNav(user?.role, t)}>
      <OrdersTable orders={orders} loading={loading} t={t} />
    </DashboardLayout>
  );
}
