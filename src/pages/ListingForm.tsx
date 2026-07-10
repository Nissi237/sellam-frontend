import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Plus, Trash2 } from "lucide-react";
import { useSeller } from "../context/SellerContext";
import type { BulkPriceTier, Product } from "../types/product";

const categories: Product["category"][] = ["Fruits & légumes", "Provisions", "Textiles"];
const units: Product["unit"][] = ["kg", "bassine", "sac", "pièce", "carton"];

export default function ListingForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { listings, addListing, updateListing } = useSeller();

  const existing = id ? listings.find((l) => l.id === id) : undefined;
  const isEdit = Boolean(existing);

  const [name, setName] = useState(existing?.name ?? "");
  const [category, setCategory] = useState<Product["category"]>(existing?.category ?? "Fruits & légumes");
  const [unit, setUnit] = useState<Product["unit"]>(existing?.unit ?? "kg");
  const [price, setPrice] = useState(existing?.price?.toString() ?? "");
  const [quantityAvailable, setQuantityAvailable] = useState(existing?.quantityAvailable?.toString() ?? "");
  const [harvestDate, setHarvestDate] = useState("");
  const [qualityGrade, setQualityGrade] = useState<Product["qualityGrade"] | "">(existing?.qualityGrade ?? "");
  const [photoUrl, setPhotoUrl] = useState(existing?.photoUrl ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [market, setMarket] = useState(existing?.market ?? "");
  const [bulkTiers, setBulkTiers] = useState<BulkPriceTier[]>(existing?.bulkPriceTiers ?? []);

  const addTierRow = () => setBulkTiers((prev) => [...prev, { minQuantity: 0, price: 0 }]);
  const updateTierRow = (index: number, field: keyof BulkPriceTier, value: number) => {
    setBulkTiers((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };
  const removeTierRow = (index: number) =>
    setBulkTiers((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload = {
      name,
      category,
      unit,
      price: Number(price),
      quantityAvailable: Number(quantityAvailable),
      qualityGrade: qualityGrade || undefined,
      bulkPriceTiers: bulkTiers.length > 0 ? bulkTiers : undefined,
      photoUrl: photoUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
      description,
      market,
      sellerName: existing?.sellerName ?? "Mama Ngozi", // TODO (backend): pull from authenticated seller session
      sellerVerified: existing?.sellerVerified ?? true,
      sellerTrustScore: existing?.sellerTrustScore,
      active: existing?.active ?? true,
    };

    if (isEdit && id) {
      updateListing(id, payload);
    } else {
      addListing(payload);
    }
    navigate("/sell");
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
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Product["category"])}
            className={inputClass}
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value as Product["unit"])}
            className={inputClass}
          >
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
            placeholder="Date de récolte"
            value={harvestDate}
            onChange={(e) => setHarvestDate(e.target.value)}
            className={inputClass}
          />
          <select
            value={qualityGrade}
            onChange={(e) => setQualityGrade(e.target.value as Product["qualityGrade"] | "")}
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
          Upload de fichier à venir avec le backend — pour l'instant, collez un lien d'image.
        </p>

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
          rows={3}
        />

        {/* Bulk price tiers, per FR-5 */}
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

        <button
          type="submit"
          className="bg-forest-800 text-cream py-3 rounded-md font-medium hover:bg-forest-950 transition mt-2"
        >
          {isEdit ? "Enregistrer les modifications" : "Publier l'annonce"}
        </button>
      </form>
    </section>
  );
}