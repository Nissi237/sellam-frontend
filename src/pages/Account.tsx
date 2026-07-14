import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, Smartphone, User as UserIcon, Gift, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import MomoAccounts from "../components/MomoAccounts";
import { getLoyalty, getReferral, type Loyalty } from "../api/endpoints";

const ROLE_LABELS: Record<string, string> = {
  individual_buyer: "Acheteur particulier",
  seller: "Vendeur",
  corporate_buyer: "Acheteur professionnel",
  admin: "Administrateur",
  delivery_agent: "Livreur",
};

export default function Account() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [loyalty, setLoyalty] = useState<Loyalty | null>(null);
  const [referral, setReferral] = useState<{ code: string; referrals: number } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    getLoyalty().then(setLoyalty).catch(() => {});
    getReferral().then(setReferral).catch(() => {});
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">
          Vous devez être connecté pour voir votre compte.
        </p>
        <Link to="/login" className="text-forest-800 underline">Se connecter</Link>
      </section>
    );
  }

  return (
    <section className="max-w-md mx-auto px-4 py-10">
      <div className="receipt-stub bg-white border border-forest-300 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <UserIcon size={22} className="text-forest-800" />
          <div>
            <h1 className="font-display text-xl text-forest-950">{user.fullName}</h1>
            <p className="text-xs text-forest-500">{ROLE_LABELS[user.role] ?? user.role}</p>
          </div>
        </div>
        <p className="text-sm text-forest-800/80 font-mono">{user.phone || user.email}</p>
      </div>

      {/* Loyalty (FR-32) + referral (FR-21) */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="flex items-center gap-1 text-xs text-forest-500 mb-1">
            <Star size={14} /> Points fidélité
          </p>
          <p className="font-mono text-2xl text-forest-950">{loyalty?.balance ?? 0}</p>
        </div>
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="flex items-center gap-1 text-xs text-forest-500 mb-1">
            <Gift size={14} /> Code parrainage
          </p>
          <p className="font-mono text-lg text-forest-950">{referral?.code ?? "…"}</p>
          <p className="text-[11px] text-forest-500">{referral?.referrals ?? 0} filleul(s)</p>
        </div>
      </div>

      <div className="receipt-stub bg-white border border-forest-300 shadow-sm p-6 mb-6">
        <h2 className="font-display text-lg text-forest-950 mb-1 flex items-center gap-2">
          <Smartphone size={18} /> Comptes Mobile Money
        </h2>
        <p className="text-xs text-forest-500 mb-4">
          Reliez vos comptes MTN MoMo et Orange Money pour payer et être payé.
        </p>
        <MomoAccounts />
      </div>

      {user.role === "corporate_buyer" && (
        <Link
          to="/subscription"
          className="block text-center border border-forest-800 text-forest-800 py-2.5 rounded-md font-medium hover:bg-forest-300/20 transition mb-3"
        >
          Gérer mon abonnement
        </Link>
      )}

      <button
        onClick={() => {
          logout();
          navigate("/");
        }}
        className="w-full flex items-center justify-center gap-2 border border-clay text-clay py-2.5 rounded-md font-medium hover:bg-clay/10 transition"
      >
        <LogOut size={16} /> Se déconnecter
      </button>
    </section>
  );
}
