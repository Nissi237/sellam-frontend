import { useState, useEffect, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchProduct,
  createProduct,
  updateProduct,
  submitOriginClaim,
} from "../api/endpoints";
import { apiError } from "../api/client";
import type { BulkPriceTier } from "../types/product";

const categories = ["Fruits & légumes", "Provisions", "Textiles"];
const units = ["kg", "bassine", "sac", "pièce", "carton"];

export default function ListingForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuth();
  const isEdit = Boolean(id);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Fruits & légumes");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");
  const [quantityAvailable, setQuantityAvailable] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [qualityGrade, setQualityGrade] = useState<"A" | "B" | "C" | "">("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [description, setDescription] = useState("");
  const [market, setMarket] = useState("");
  const [bulkTiers, setBulkTiers] = useState<BulkPriceTier[]>([]);
  const [originClaim, setOriginClaim] = useState("");
  const [originDocUrl, setOriginDocUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Prefill when editing.
  useEffect(() => {
    if (!id) return;
    fetchProduct(id)
      .then((p) => {
        setName(p.name);
        setCategory(p.category);
        setUnit(p.unit);
        setPrice(String(p.price));
        setQuantityAvailable(String(p.quantityAvailable));
        setHarvestDate(p.harvestDate ? p.harvestDate.slice(0, 10) : "");
        setQualityGrade((p.qualityGrade as "A" | "B" | "C") ?? "");
        setPhotoUrl(p.photoUrl ?? "");
        setDescription(p.description ?? "");
        setMarket(p.market ?? "");
        setBulkTiers(p.bulkPriceTiers ?? []);
      })
      .catch(() => setError("Annonce introuvable."));
  }, [id]);

  if (!isAuthenticated || user?.role !== "seller") {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">
          Vous devez être connecté en tant que vendeur.
        </p>
        <Link to="/login" className="text-forest-800 underline">Se connecter</Link>
      </section>
    );
  }

  const addTierRow = () => setBulkTiers((prev) => [...prev, { minQuantity: 0, price: 0 }]);
  const updateTierRow = (index: number, field: keyof BulkPriceTier, value: number) => {
    setBulkTiers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };
  const removeTierRow = (index: number) =>
    setBulkTiers((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    const payload = {
      name,
      category,
      unit,
      price: Number(price),
      quantityAvailable: Number(quantityAvailable),
      qualityGrade: qualityGrade || undefined,
      harvestDate: harvestDate || undefined,
      bulkPriceTiers: bulkTiers.filter((t) => t.minQuantity > 0 && t.price > 0),
      photoUrl: photoUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
      description,
      market,
    };

    try {
      const saved = isEdit && id ? await updateProduct(id, payload) : await createProduct(payload);
      // FR-41: submit an origin claim + document (pending Admin review).
      if (originClaim.trim() && originDocUrl.trim()) {
        await submitOriginClaim(saved.id, {
          claim: originClaim.trim(),
          documentType: "document",
          fileUrl: originDocUrl.trim(),
        });
      }
      navigate("/sell");
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800";

  return (
    <section className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl text-forest-950 mb-6">
        {isEdit ? "Modifier l'annonce" : "Nouvelle annonce"}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder="Nom du produit"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputClass}>
            {units.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder="Prix (FCFA)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
            required
            min={0}
          />
          <input
            type="number"
            placeholder="Quantité disponible"
            value={quantityAvailable}
            onChange={(e) => setQuantityAvailable(e.target.value)}
            className={inputClass}
            required
            min={0}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="date"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            className={inputClass}
          />
          <select
            value={qualityGrade}
            onChange={(e) => setQualityGrade(e.target.value as "A" | "B" | "C" | "")}
            className={inputClass}
          >
            <option value="">Grade qualité (optionnel)</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>

        <input
          type="text"
          placeholder="Marché (ex : Marché Central)"
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className={inputClass}
        />

        <input
          type="url"
          placeholder="URL de la photo"
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          className={inputClass}
        />
        <p className="text-xs text-forest-500 -mt-2">
          Upload de fichier à venir — pour l'instant, collez un lien d'image.
        </p>

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
          rows={3}
        />

        {/* Bulk price tiers (FR-5) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-forest-800">Tarifs dégressifs (optionnel)</p>
            <button
              type="button"
              onClick={addTierRow}
              className="flex items-center gap-1 text-xs text-forest-800 border border-forest-300 rounded-full px-2 py-1 hover:bg-forest-300/20"
            >
              <Plus size={12} /> Ajouter un palier
            </button>
          </div>
          {bulkTiers.map((tier, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="number"
                placeholder="Qté min"
                value={tier.minQuantity || ""}
                onChange={(e) => updateTierRow(index, "minQuantity", Number(e.target.value))}
                className={inputClass}
                min={0}
              />
              <input
                type="number"
                placeholder="Prix unitaire"
                value={tier.price || ""}
                onChange={(e) => updateTierRow(index, "price", Number(e.target.value))}
                className={inputClass}
                min={0}
              />
              <button
                type="button"
                onClick={() => removeTierRow(index)}
                className="text-clay hover:text-clay/70 shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Origin / authenticity claim (FR-41) */}
        <div className="border border-dashed border-forest-300 rounded-md p-3">
          <p className="text-sm font-medium text-forest-800 mb-2">
            Allégation d'origine (optionnel)
          </p>
          <input
            type="text"
            placeholder='ex : "Fait au Cameroun"'
            value={originClaim}
            onChange={(e) => setOriginClaim(e.target.value)}
            className={`${inputClass} mb-2`}
          />
          <input
            type="url"
            placeholder="Lien du document justificatif (facture, certificat…)"
            value={originDocUrl}
            onChange={(e) => setOriginDocUrl(e.target.value)}
            className={inputClass}
          />
          <p className="text-[11px] text-forest-500 mt-1">
            L'allégation ne s'affiche qu'après vérification du document par un administrateur.
          </p>
        </div>

        {error && <p className="text-clay text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="bg-forest-800 text-cream py-3 rounded-md font-medium hover:bg-forest-950 transition mt-2 disabled:opacity-60"
        >
          {isEdit ? "Enregistrer les modifications" : "Publier l'annonce"}
        </button>
      </form>
    </section>
  );
}
