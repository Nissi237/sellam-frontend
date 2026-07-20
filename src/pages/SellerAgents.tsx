import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Bike, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import DashboardLayout from "../components/DashboardLayout";
import { buildSellerNav } from "../utils/sellerNav";
import { apiError } from "../api/client";
import {
  listDeliveryAgents,
  createDeliveryAgent,
  deleteDeliveryAgent,
  type SellerDeliveryAgent,
} from "../api/endpoints";

export default function SellerAgents() {
  const { t } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const isSeller = user?.role === "seller";

  const [agents, setAgents] = useState<SellerDeliveryAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = () =>
    listDeliveryAgents()
      .then(setAgents)
      .catch(() => setAgents([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    const run = async () => {
      if (!(isAuthenticated && isSeller)) {
        setLoading(false);
        return;
      }
      load();
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

  const add = async () => {
    if (!fullName.trim() || !phone.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createDeliveryAgent(fullName.trim(), phone.trim());
      setFullName("");
      setPhone("");
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a: SellerDeliveryAgent) => {
    if (!confirm(t("sellerOps.confirmRemove", { name: a.fullName }))) return;
    await deleteDeliveryAgent(a.id).catch(() => {});
    await load();
  };

  return (
    <DashboardLayout title={t("sellerOps.agentsTitle")} nav={buildSellerNav(t)}>
      <div className="max-w-3xl mx-auto">
        <p className="text-sm text-forest-500 mb-5">{t("sellerOps.agentsSubtitle")}</p>

        {/* Add-agent form */}
        <div className="receipt-stub bg-white border border-forest-300 p-4 mb-6">
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("sellerOps.agentName")}
              className="px-3 py-2 border border-forest-300 rounded-md text-sm"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("sellerOps.agentPhone")}
              className="px-3 py-2 border border-forest-300 rounded-md text-sm"
            />
          </div>
          {error && <p className="text-clay text-sm mt-2">{error}</p>}
          <button
            onClick={add}
            disabled={saving || !fullName.trim() || !phone.trim()}
            className="mt-3 flex items-center gap-1 bg-forest-800 text-cream px-4 py-2 rounded-md text-sm font-medium hover:bg-forest-950 transition disabled:opacity-50"
          >
            <Plus size={16} /> {t("sellerOps.addAgent")}
          </button>
        </div>

        {/* Agent list */}
        {loading ? (
          <p className="text-forest-800/70 font-body py-8 text-center">{t("common.loading")}</p>
        ) : agents.length === 0 ? (
          <p className="text-forest-800/70 font-body py-8 text-center">{t("sellerOps.noAgents")}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {agents.map((a) => (
              <div key={a.id} className="receipt-stub bg-white border border-forest-300 p-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-forest-300/40 flex items-center justify-center text-forest-800">
                  <Bike size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body font-semibold text-forest-950 truncate">{a.fullName}</p>
                  <p className="text-xs text-forest-500 font-mono">{a.phone}</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded bg-forest-300/30 text-forest-800">
                  {t("sellerOps.activeJobs", { count: a.activeJobs })}
                </span>
                <button
                  onClick={() => remove(a)}
                  className="p-2 text-clay hover:bg-clay/10 rounded-md"
                  title={t("sellerOps.remove")}
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
