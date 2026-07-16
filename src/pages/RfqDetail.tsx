import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Check, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  getRfq,
  submitQuote,
  acceptQuote,
  rejectQuote,
  type Rfq,
  type Quote,
} from "../api/endpoints";
import { apiError } from "../api/client";
import { formatPrice } from "../utils/format";

const categoryKeys: Record<string, string> = {
  "Fruits & légumes": "produce",
  "Provisions": "groceries",
  "Textiles": "textiles",
};

export default function RfqDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [rfq, setRfq] = useState<Rfq | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [unitPrice, setUnitPrice] = useState("");
  const [deliveryTerms, setDeliveryTerms] = useState("");

  const load = () => {
    if (!id) return;
    getRfq(id)
      .then((d) => {
        setRfq(d.rfq);
        setQuotes(d.quotes);
      })
      .catch(() => setRfq(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <p className="text-center py-16 text-forest-800/70">{t("common.loading")}</p>;
  if (!rfq)
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 mb-4">{t("rfq.notFound")}</p>
        <Link to="/rfqs" className="text-forest-800 underline">{t("rfq.backToRfqs")}</Link>
      </section>
    );

  const isOwner = user?.id === rfq.corporateBuyerId;
  const isSeller = user?.role === "seller";
  const myQuote = quotes.find((q) => q.sellerId === user?.id);
  const canQuote = isSeller && !myQuote && ["open", "quoted"].includes(rfq.status);
  const total = (q: Quote) => q.unitPrice * rfq.quantity;

  const doSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!unitPrice || Number(unitPrice) < 0) {
      setError(t("rfq.unitPriceRequired"));
      return;
    }
    try {
      await submitQuote(rfq.id, { unitPrice: Number(unitPrice), deliveryTerms: deliveryTerms.trim() || undefined });
      setUnitPrice("");
      setDeliveryTerms("");
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  const doAccept = async (q: Quote) => {
    try {
      const res = await acceptQuote(rfq.id, q.id);
      // Go straight to the resulting order's tracking view.
      if (res.orderId) navigate(`/order-tracking/${res.orderId}`);
      else load();
    } catch (err) {
      setError(apiError(err));
    }
  };
  const doReject = async (q: Quote) => {
    await rejectQuote(rfq.id, q.id);
    load();
  };

  const inputClass =
    "w-full px-3 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800";

  return (
    <section className="max-w-2xl mx-auto px-4 py-8">
      <Link to="/rfqs" className="inline-flex items-center gap-1 text-sm text-forest-800 hover:text-forest-950 mb-6">
        <ArrowLeft size={16} /> {t("rfq.backToRfqs")}
      </Link>

      <div className="receipt-stub bg-white border border-forest-300 p-5 mb-6">
        <h1 className="font-display text-xl text-forest-950 mb-1">
          {rfq.quantity} {t(`unit.${rfq.unit}`, rfq.unit ?? "")} · {t(`category.${categoryKeys[rfq.productCategory] ?? ""}`, rfq.productCategory)}
        </h1>
        <p className="text-sm text-forest-500 mb-3">
          {t(`freq.${rfq.frequency}`, rfq.frequency)} · {rfq.businessName ?? rfq.buyerName}
          {rfq.deliveryLocation ? ` · ${rfq.deliveryLocation}` : ""}
        </p>
        {rfq.notes && <p className="text-sm text-forest-800/80 font-body">{rfq.notes}</p>}
      </div>

      {canQuote && (
        <form onSubmit={doSubmit} className="receipt-stub bg-white border border-forest-300 p-5 mb-6">
          <p className="font-body font-semibold text-forest-800 mb-3">{t("rfq.proposeQuote")}</p>
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            <input type="number" min={0} placeholder={t("rfq.pricePerUnit", { unit: t(`unit.${rfq.unit}`, rfq.unit ?? "") })} value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)} className={inputClass} />
            <input type="text" placeholder={t("rfq.deliveryTermsPlaceholder")} value={deliveryTerms}
              onChange={(e) => setDeliveryTerms(e.target.value)} className={inputClass} />
          </div>
          {unitPrice && (
            <p className="text-xs text-forest-500 mb-2">
              {t("rfq.totalFor", { qty: rfq.quantity, unit: t(`unit.${rfq.unit}`, rfq.unit ?? ""), amount: formatPrice(Number(unitPrice) * rfq.quantity) })}
            </p>
          )}
          {error && <p className="text-clay text-sm mb-2">{error}</p>}
          <button type="submit" className="bg-forest-800 text-cream px-4 py-2 rounded-md text-sm font-medium hover:bg-forest-950 transition">
            {t("rfq.sendQuote")}
          </button>
        </form>
      )}

      <h2 className="font-body font-semibold text-forest-800 mb-3">
        {t("rfq.quotesReceived", { count: quotes.length })}
      </h2>
      {error && !canQuote && <p className="text-clay text-sm mb-2">{error}</p>}
      {quotes.length === 0 ? (
        <p className="text-forest-800/70 font-body py-4">{t("rfq.noQuotes")}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {quotes.map((q) => (
            <div key={q.id} className="receipt-stub bg-white border border-forest-300 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-body font-semibold text-forest-950">{q.sellerName}</p>
                  <p className="font-mono text-forest-800">
                    {t("rfq.quoteTotal", { price: formatPrice(q.unitPrice), unit: t(`unit.${rfq.unit}`, rfq.unit ?? ""), amount: formatPrice(total(q)) })}
                  </p>
                  {q.deliveryTerms && <p className="text-xs text-forest-500">{q.deliveryTerms}</p>}
                </div>
                <span className={`text-xs font-mono px-2 py-1 rounded ${
                  q.status === "accepted" ? "bg-leaf/20 text-leaf"
                  : q.status === "rejected" ? "bg-clay/20 text-clay"
                  : "bg-forest-300/30 text-forest-800"
                }`}>
                  {q.status === "accepted" ? t("rfq.quoteStatus.accepted") : q.status === "rejected" ? t("rfq.quoteStatus.rejected") : t("rfq.quoteStatus.pending")}
                </span>
              </div>

              {isOwner && q.status === "pending" && ["open", "quoted"].includes(rfq.status) && (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => doAccept(q)}
                    className="flex items-center gap-1 bg-forest-800 text-cream px-3 py-1.5 rounded-md text-sm hover:bg-forest-950 transition">
                    <Check size={14} /> {t("rfq.accept")}
                  </button>
                  <button onClick={() => doReject(q)}
                    className="flex items-center gap-1 border border-clay text-clay px-3 py-1.5 rounded-md text-sm hover:bg-clay/10 transition">
                    <X size={14} /> {t("rfq.reject")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
