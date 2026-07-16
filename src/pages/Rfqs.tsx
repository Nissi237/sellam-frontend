import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { FileText, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { listRfqs, createRfq, type Rfq } from "../api/endpoints";
import { apiError } from "../api/client";

const categories = [
  { value: "Fruits & légumes", key: "produce" },
  { value: "Provisions", key: "groceries" },
  { value: "Textiles", key: "textiles" },
];
const units = ["kg", "bassine", "sac", "pièce", "carton"];
const freqKeys = ["one_time", "daily", "weekly", "monthly"];

export default function Rfqs() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const isSeller = user?.role === "seller";
  const isCorporate = user?.role === "corporate_buyer";

  const [rfqs, setRfqs] = useState<Rfq[]>([]);
  const [loading, setLoading] = useState(true);

  // create form
  const [category, setCategory] = useState(categories[0].value);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState(units[0]);
  const [frequency, setFrequency] = useState("one_time");
  const [deliveryLocation, setDeliveryLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () =>
    listRfqs(isSeller ? "seller" : undefined)
      .then(setRfqs)
      .catch(() => setRfqs([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (isAuthenticated && (isSeller || isCorporate)) load();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  if (!isAuthenticated) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">{t("rfq.loginRequired")}</p>
        <Link to="/login" className="text-forest-800 underline">{t("seller.login")}</Link>
      </section>
    );
  }
  if (!isSeller && !isCorporate) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body">
          {t("rfq.restrictedRole")}
        </p>
      </section>
    );
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!quantity || Number(quantity) <= 0) {
      setError(t("rfq.quantityRequired"));
      return;
    }
    setSaving(true);
    try {
      await createRfq({
        productCategory: category,
        quantity: Number(quantity),
        unit,
        frequency,
        deliveryLocation: deliveryLocation.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      setQuantity("");
      setDeliveryLocation("");
      setNotes("");
      load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-3 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800";

  return (
    <section className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl text-forest-950 mb-6 flex items-center gap-2">
        <FileText size={22} /> {isSeller ? t("rfq.openTitle") : t("rfq.myTitle")}
      </h1>

      {isCorporate && (
        <form onSubmit={submit} className="receipt-stub bg-white border border-forest-300 p-5 mb-8">
          <p className="font-body font-semibold text-forest-800 mb-3">{t("rfq.newTitle")}</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {categories.map((c) => <option key={c.value} value={c.value}>{t(`category.${c.key}`)}</option>)}
            </select>
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className={inputClass}>
              {freqKeys.map((f) => <option key={f} value={f}>{t(`freq.${f}`)}</option>)}
            </select>
            <input type="number" min={1} placeholder={t("rfq.quantityPlaceholder")} value={quantity}
              onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputClass}>
              {units.map((u) => <option key={u} value={u}>{t(`unit.${u}`)}</option>)}
            </select>
          </div>
          <input type="text" placeholder={t("rfq.locationPlaceholder")} value={deliveryLocation}
            onChange={(e) => setDeliveryLocation(e.target.value)} className={`${inputClass} mb-3`} />
          <textarea placeholder={t("rfq.notesPlaceholder")} value={notes}
            onChange={(e) => setNotes(e.target.value)} className={`${inputClass} mb-3`} rows={2} />
          {error && <p className="text-clay text-sm mb-2">{error}</p>}
          <button type="submit" disabled={saving}
            className="flex items-center gap-1 bg-forest-800 text-cream px-4 py-2 rounded-md text-sm font-medium hover:bg-forest-950 transition disabled:opacity-60">
            <Plus size={16} /> {t("rfq.publish")}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-forest-800/70 font-body py-8 text-center">{t("common.loading")}</p>
      ) : rfqs.length === 0 ? (
        <p className="text-forest-800/70 font-body py-8 text-center">
          {isSeller ? t("rfq.noneOpen") : t("rfq.noneMine")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {rfqs.map((r) => (
            <Link key={r.id} to={`/rfqs/${r.id}`}
              className="receipt-stub bg-white border border-forest-300 p-4 flex items-center justify-between hover:shadow-md transition">
              <div>
                <p className="font-body font-semibold text-forest-950">
                  {r.quantity} {t(`unit.${r.unit}`, r.unit ?? "")} · {t(`category.${categories.find((c) => c.value === r.productCategory)?.key ?? ""}`, r.productCategory)}
                </p>
                <p className="text-xs text-forest-500">
                  {t(`freq.${r.frequency}`, r.frequency)}
                  {isSeller ? ` · ${r.businessName ?? r.buyerName}` : ""}
                  {r.quoteCount !== undefined ? ` · ${t("rfq.quoteCount", { count: r.quoteCount })}` : ""}
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-1 rounded bg-forest-300/30 text-forest-800">
                {t(`rfq.status.${r.status}`, r.status)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
