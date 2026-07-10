import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, EyeOff, TrendingUp, Users, Package } from "lucide-react";
import { useSeller } from "../context/SellerContext";
import { formatPrice } from "../utils/format";

// TODO (backend): replace with GET /sellers/me/stats, per FR-24
const stats = {
  salesThisWeek: 87500,
  topProduct: "Plantains mûrs",
  repeatBuyerRate: 42,
};

export default function SellerDashboard() {
  const { listings, toggleActive, deleteListing } = useSeller();

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-forest-950">Tableau de bord vendeur</h1>
        <Link
          to="/sell/new"
          className="flex items-center gap-1 bg-forest-800 text-cream px-4 py-2 rounded-md text-sm font-medium hover:bg-forest-950 transition"
        >
          <Plus size={16} /> Nouvelle annonce
        </Link>
      </div>

      {/* Stats cards, per FR-24 */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="flex items-center gap-1 text-xs text-forest-500 mb-1">
            <TrendingUp size={14} /> Ventes cette semaine
          </p>
          <p className="font-mono text-xl text-forest-950">{formatPrice(stats.salesThisWeek)}</p>
        </div>
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="flex items-center gap-1 text-xs text-forest-500 mb-1">
            <Package size={14} /> Produit le plus vendu
          </p>
          <p className="font-body text-lg text-forest-950">{stats.topProduct}</p>
        </div>
        <div className="receipt-stub bg-white border border-forest-300 p-4">
          <p className="flex items-center gap-1 text-xs text-forest-500 mb-1">
            <Users size={14} /> Taux de clients fidèles
          </p>
          <p className="font-mono text-xl text-forest-950">{stats.repeatBuyerRate}%</p>
        </div>
      </div>

      {/* Listings */}
      <h2 className="font-body font-semibold text-forest-800 mb-3">Mes annonces</h2>

      {listings.length === 0 ? (
        <p className="text-forest-800/70 font-body py-8 text-center">
          Aucune annonce pour le moment.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className={`receipt-stub bg-white border border-forest-300 p-4 flex items-center gap-4 ${
                !listing.active ? "opacity-50" : ""
              }`}
            >
              <img
                src={listing.photoUrl}
                alt={listing.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div className="flex-1">
                <p className="font-body font-semibold text-forest-950">{listing.name}</p>
                <p className="font-mono text-sm text-forest-800">
                  {formatPrice(listing.price)} / {listing.unit}
                </p>
                <p className="text-xs text-forest-500">
                  {listing.quantityAvailable} {listing.unit}s disponibles
                  {!listing.active && " · Inactif"}
                </p>
              </div>
              <button
                onClick={() => toggleActive(listing.id)}
                className="p-2 text-forest-800 hover:bg-forest-300/20 rounded-md"
                title={listing.active ? "Désactiver" : "Activer"}
              >
                {listing.active ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              <Link
                to={`/sell/edit/${listing.id}`}
                className="p-2 text-forest-800 hover:bg-forest-300/20 rounded-md"
                title="Modifier"
              >
                <Pencil size={18} />
              </Link>
              <button
                onClick={() => {
                  if (confirm(`Supprimer "${listing.name}" ?`)) deleteListing(listing.id);
                }}
                className="p-2 text-clay hover:bg-clay/10 rounded-md"
                title="Supprimer"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}