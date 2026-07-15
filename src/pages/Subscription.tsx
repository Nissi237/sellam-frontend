import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, Crown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getSubscription, setSubscription, type Plan } from "../api/endpoints";

const TIERS: Plan["tier"][] = ["Basic", "Pro", "Enterprise"];

export default function Subscription() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user?.role === "corporate_buyer") getSubscription().then(setPlan).catch(() => {});
  }, [isAuthenticated, user?.role]);

  if (!isAuthenticated || user?.role !== "corporate_buyer") {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body">
          {t("sub.corpOnly")}
        </p>
        <Link to="/login" className="text-forest-800 underline">{t("seller.login")}</Link>
      </section>
    );
  }

  const choose = async (tier: string) => {
    setSaving(tier);
    try {
      setPlan(await setSubscription(tier));
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl text-forest-950 mb-1 flex items-center gap-2">
        <Crown size={22} /> {t("sub.title")}
      </h1>
      <p className="text-sm text-forest-500 mb-6">
        {t("sub.currentPlan")} <span className="font-semibold text-forest-800">{plan?.tier ?? "…"}</span>
        {plan?.renewalDate ? t("sub.renewal", { date: plan.renewalDate.slice(0, 10) }) : ""}
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        {TIERS.map((tier) => {
          const current = plan?.tier === tier;
          const perks = t(`sub.tiers.${tier}.perks`, { returnObjects: true }) as string[];
          return (
            <div
              key={tier}
              className={`receipt-stub bg-white border p-5 flex flex-col ${
                current ? "border-forest-800 ring-2 ring-forest-800/20" : "border-forest-300"
              }`}
            >
              <p className="font-display text-lg text-forest-950">{tier}</p>
              <p className="font-mono text-sm text-forest-800 mb-3">{t(`sub.tiers.${tier}.price`)}</p>
              <ul className="flex flex-col gap-1 mb-4 flex-1">
                {perks.map((p) => (
                  <li key={p} className="text-xs text-forest-800/80 flex items-center gap-1">
                    <Check size={12} className="text-leaf" /> {p}
                  </li>
                ))}
              </ul>
              <button
                disabled={current || saving === tier}
                onClick={() => choose(tier)}
                className={`py-2 rounded-md text-sm font-medium transition ${
                  current
                    ? "bg-forest-300/30 text-forest-500 cursor-default"
                    : "bg-forest-800 text-cream hover:bg-forest-950"
                }`}
              >
                {current ? t("sub.currentBtn") : saving === tier ? "…" : t("sub.choose")}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
