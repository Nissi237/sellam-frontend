import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Crown } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getSubscription, setSubscription, type Plan } from "../api/endpoints";

const TIERS: { tier: Plan["tier"]; price: string; perks: string[] }[] = [
  { tier: "Basic", price: "Gratuit", perks: ["Commandes B2B", "Demandes de devis (RFQ)"] },
  { tier: "Pro", price: "15 000 FCFA / mois", perks: ["Tout Basic", "Devis prioritaires", "Analytique des dépenses"] },
  { tier: "Enterprise", price: "50 000 FCFA / mois", perks: ["Tout Pro", "Gestionnaire de compte dédié", "Rapports personnalisés"] },
];

export default function Subscription() {
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
          Les abonnements sont réservés aux acheteurs professionnels.
        </p>
        <Link to="/login" className="text-forest-800 underline">Se connecter</Link>
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
        <Crown size={22} /> Abonnement professionnel
      </h1>
      <p className="text-sm text-forest-500 mb-6">
        Formule actuelle : <span className="font-semibold text-forest-800">{plan?.tier ?? "…"}</span>
        {plan?.renewalDate ? ` · renouvellement le ${plan.renewalDate.slice(0, 10)}` : ""}
      </p>

      <div className="grid sm:grid-cols-3 gap-4">
        {TIERS.map((t) => {
          const current = plan?.tier === t.tier;
          return (
            <div
              key={t.tier}
              className={`receipt-stub bg-white border p-5 flex flex-col ${
                current ? "border-forest-800 ring-2 ring-forest-800/20" : "border-forest-300"
              }`}
            >
              <p className="font-display text-lg text-forest-950">{t.tier}</p>
              <p className="font-mono text-sm text-forest-800 mb-3">{t.price}</p>
              <ul className="flex flex-col gap-1 mb-4 flex-1">
                {t.perks.map((p) => (
                  <li key={p} className="text-xs text-forest-800/80 flex items-center gap-1">
                    <Check size={12} className="text-leaf" /> {p}
                  </li>
                ))}
              </ul>
              <button
                disabled={current || saving === t.tier}
                onClick={() => choose(t.tier)}
                className={`py-2 rounded-md text-sm font-medium transition ${
                  current
                    ? "bg-forest-300/30 text-forest-500 cursor-default"
                    : "bg-forest-800 text-cream hover:bg-forest-950"
                }`}
              >
                {current ? "Formule actuelle" : saving === t.tier ? "…" : "Choisir"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
