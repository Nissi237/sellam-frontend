import { useState, useEffect, type FormEvent, type ChangeEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Upload, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchProduct,
  createProduct,
  updateProduct,
  submitOriginClaim,
  uploadFile,
} from "../api/endpoints";
import { apiError } from "../api/client";
import type { BulkPriceTier } from "../types/product";

const categories = [
  { value: "Fruits & légumes", key: "produce" },
  { value: "Provisions", key: "groceries" },
  { value: "Textiles", key: "textiles" },
];
const units = ["kg", "bassine", "sac", "pièce", "carton"];

export default function ListingForm() {
  const { t } = useTranslation();
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
  const [videoUrl, setVideoUrl] = useState("");
  const [ownershipProofUrl, setOwnershipProofUrl] = useState("");
  const [description, setDescription] = useState("");
  const [market, setMarket] = useState("");
  const [bulkTiers, setBulkTiers] = useState<BulkPriceTier[]>([]);
  const [originClaim, setOriginClaim] = useState("");
  const [originDocUrl, setOriginDocUrl] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  // After saving, if the image duplicates another listing and no proof was given,
  // we keep the seller here to (optionally) attach proof of ownership.
  const [proofPromptId, setProofPromptId] = useState<string | null>(null);

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
        setVideoUrl(p.videoUrl ?? "");
        setOwnershipProofUrl(p.ownershipProofUrl ?? "");
        setDescription(p.description ?? "");
        setMarket(p.market ?? "");
        setBulkTiers(p.bulkPriceTiers ?? []);
      })
      .catch(() => setError(t("listing.notFound")));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!isAuthenticated || user?.role !== "seller") {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">
          {t("listing.mustBeSeller")}
        </p>
        <Link to="/login" className="text-forest-800 underline">{t("seller.login")}</Link>
      </section>
    );
  }

  const upload = async (
    e: ChangeEvent<HTMLInputElement>,
    setter: (v: string) => void,
    field: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setUploading(field);
    try {
      const { url } = await uploadFile(file);
      setter(url);
    } catch (err) {
      setError(apiError(err, t("listing.uploadError")));
    } finally {
      setUploading(null);
    }
  };

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
      photoUrl: photoUrl || "",
      videoUrl: videoUrl || undefined,
      ownershipProofUrl: ownershipProofUrl || undefined,
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
      // Duplicate image detected with no proof → stay and offer to attach it.
      if (!isEdit && saved.needsOwnershipProof && !ownershipProofUrl) {
        setProofPromptId(saved.id);
        setSaving(false);
        return;
      }
      navigate("/sell");
    } catch (err) {
      setError(apiError(err));
      setSaving(false);
    }
  };

  const attachProofNow = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !proofPromptId) return;
    setUploading("proof-prompt");
    try {
      const { url } = await uploadFile(file);
      await updateProduct(proofPromptId, { ownershipProofUrl: url });
      navigate("/sell");
    } catch (err) {
      setError(apiError(err, t("listing.uploadError")));
      setUploading(null);
    }
  };

  const inputClass =
    "w-full px-4 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800";
  const fileLabel =
    "flex items-center gap-2 cursor-pointer text-sm text-forest-800 border border-dashed border-forest-300 rounded-md px-3 py-2 hover:bg-forest-300/10";

  // Proof-of-ownership prompt (shown after saving a duplicate-image listing).
  if (proofPromptId) {
    return (
      <section className="max-w-xl mx-auto px-4 py-10">
        <div className="receipt-stub bg-white border border-clay/40 p-5">
          <p className="flex items-center gap-2 font-medium text-forest-950 mb-2">
            <ShieldCheck size={18} className="text-clay" /> {t("listing.proofPromptTitle")}
          </p>
          <p className="text-sm text-forest-800/80 mb-4">
            {t("listing.proofPromptBody")}
          </p>
          <label className={fileLabel}>
            <Upload size={16} />
            {uploading === "proof-prompt" ? t("listing.uploading") : t("listing.addProofMedia")}
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={attachProofNow}
              disabled={uploading === "proof-prompt"}
            />
          </label>
          {error && <p className="text-clay text-sm mt-2">{error}</p>}
          <button
            onClick={() => navigate("/sell")}
            className="mt-4 text-sm text-forest-800 underline"
          >
            {t("listing.later")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="max-w-xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl text-forest-950 mb-6">
        {isEdit ? t("listing.editTitle") : t("listing.newTitle")}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="text"
          placeholder={t("listing.namePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={inputClass}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>{t(`category.${c.key}`)}</option>
            ))}
          </select>
          <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputClass}>
            {units.map((u) => (
              <option key={u} value={u}>{t(`unit.${u}`)}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="number"
            placeholder={t("listing.pricePlaceholder")}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
            required
            min={0}
          />
          <input
            type="number"
            placeholder={t("listing.quantityPlaceholder")}
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
            <option value="">{t("listing.gradeOptional")}</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>

        <input
          type="text"
          placeholder={t("listing.marketPlaceholder")}
          value={market}
          onChange={(e) => setMarket(e.target.value)}
          className={inputClass}
        />

        {/* Photo upload */}
        <div>
          <p className="text-sm font-medium text-forest-800 mb-2">{t("listing.photo")}</p>
          <div className="flex items-center gap-3">
            <label className={fileLabel}>
              <Upload size={16} /> {uploading === "photo" ? t("listing.uploading") : t("listing.chooseImage")}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => upload(e, setPhotoUrl, "photo")}
                disabled={uploading === "photo"}
              />
            </label>
            {photoUrl && (
              <img src={photoUrl} alt="aperçu" className="w-16 h-16 object-cover rounded border border-forest-300" />
            )}
          </div>
        </div>

        {/* Video upload (optional) */}
        <div>
          <p className="text-sm font-medium text-forest-800 mb-2">
            {t("listing.video")} <span className="text-forest-500 font-normal">{t("listing.optional")}</span>
          </p>
          <div className="flex items-center gap-3">
            <label className={fileLabel}>
              <Upload size={16} /> {uploading === "video" ? t("listing.uploading") : t("listing.chooseVideo")}
              <input
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => upload(e, setVideoUrl, "video")}
                disabled={uploading === "video"}
              />
            </label>
            {videoUrl && (
              <video src={videoUrl} className="w-24 h-16 object-cover rounded border border-forest-300" muted />
            )}
          </div>
        </div>

        <textarea
          placeholder={t("listing.descriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass}
          rows={3}
        />

        {/* Proof of ownership (optional; expected when reusing an existing image) */}
        <div className="border border-dashed border-forest-300 rounded-md p-3">
          <p className="text-sm font-medium text-forest-800 mb-1">
            {t("listing.proof")} <span className="text-forest-500 font-normal">{t("listing.optional")}</span>
          </p>
          <p className="text-[11px] text-forest-500 mb-2">
            {t("listing.proofNote")}
          </p>
          <div className="flex items-center gap-3">
            <label className={fileLabel}>
              <Upload size={16} /> {uploading === "proof" ? t("listing.uploading") : t("listing.addProof")}
              <input
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => upload(e, setOwnershipProofUrl, "proof")}
                disabled={uploading === "proof"}
              />
            </label>
            {ownershipProofUrl && <span className="text-xs text-leaf">{t("listing.proofAdded")}</span>}
          </div>
        </div>

        {/* Bulk price tiers (FR-5) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-forest-800">{t("listing.bulkTiers")}</p>
            <button
              type="button"
              onClick={addTierRow}
              className="flex items-center gap-1 text-xs text-forest-800 border border-forest-300 rounded-full px-2 py-1 hover:bg-forest-300/20"
            >
              <Plus size={12} /> {t("listing.addTier")}
            </button>
          </div>
          {bulkTiers.map((tier, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="number"
                placeholder={t("listing.minQty")}
                value={tier.minQuantity || ""}
                onChange={(e) => updateTierRow(index, "minQuantity", Number(e.target.value))}
                className={inputClass}
                min={0}
              />
              <input
                type="number"
                placeholder={t("listing.unitPrice")}
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
            {t("listing.originClaim")}
          </p>
          <input
            type="text"
            placeholder={t("listing.originPlaceholder")}
            value={originClaim}
            onChange={(e) => setOriginClaim(e.target.value)}
            className={`${inputClass} mb-2`}
          />
          <input
            type="url"
            placeholder={t("listing.originDocPlaceholder")}
            value={originDocUrl}
            onChange={(e) => setOriginDocUrl(e.target.value)}
            className={inputClass}
          />
          <p className="text-[11px] text-forest-500 mt-1">
            {t("listing.originNote")}
          </p>
        </div>

        {error && <p className="text-clay text-sm">{error}</p>}

        <button
          type="submit"
          disabled={saving || Boolean(uploading)}
          className="bg-forest-800 text-cream py-3 rounded-md font-medium hover:bg-forest-950 transition mt-2 disabled:opacity-60"
        >
          {isEdit ? t("listing.save") : t("listing.publish")}
        </button>
      </form>
    </section>
  );
}
