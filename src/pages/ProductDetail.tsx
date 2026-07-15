import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BadgeCheck, Star, MapPin, MessageCircle, ArrowLeft, Minus, Plus, FileCheck } from "lucide-react";
import { fetchProduct, fetchReviews, respondToReview, disputeReview } from "../api/endpoints";
import type { Review } from "../api/endpoints";
import type { Product } from "../types/product";
import { formatPrice } from "../utils/format";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";

export default function ProductDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchProduct(id)
      .then((p) => {
        setProduct(p);
        return fetchReviews({ productId: id });
      })
      .then(setReviews)
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body">{t("common.loading")}</p>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">{t("product.notFound")}</p>
        <Link to="/browse" className="text-forest-800 underline">
          {t("nav.browse")}
        </Link>
      </section>
    );
  }

  const tiers = product.bulkPriceTiers ?? [];
  const hasTiers = tiers.length > 0;
  const hasPromo = product.promoPrice != null && product.promoPrice < product.price;
  // Base = promotion price if any (FR-20); bulk tiers can lower it further (FR-5).
  const base = product.effectivePrice ?? product.price;
  const tierPrice = hasTiers
    ? [...tiers]
        .sort((a, b) => b.minQuantity - a.minQuantity)
        .find((tier) => quantity >= tier.minQuantity)?.price
    : undefined;
  const activePrice = tierPrice != null ? Math.min(base, tierPrice) : base;

  const handleAddToCart = () => {
    addItem(product, quantity, activePrice);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  };

  const isProductSeller = user?.id === product.sellerId;
  const refreshReviews = () => id && fetchReviews({ productId: id }).then(setReviews).catch(() => {});
  const respond = async (reviewId: string) => {
    const text = prompt(t("product.responsePrompt"));
    if (text?.trim()) {
      await respondToReview(reviewId, text.trim());
      refreshReviews();
    }
  };
  const dispute = async (reviewId: string) => {
    const reason = prompt(t("product.disputePrompt"));
    if (reason?.trim()) {
      await disputeReview(reviewId, reason.trim());
      alert(t("product.disputeSent"));
    }
  };

  return (
    <section className="max-w-4xl mx-auto px-4 py-8">
      <Link
        to="/browse"
        className="inline-flex items-center gap-1 text-sm text-forest-800 hover:text-forest-950 mb-6"
      >
        <ArrowLeft size={16} /> {t("nav.browse")}
      </Link>

      <div className="grid sm:grid-cols-2 gap-8">
        <div>
          <img
            src={product.photoUrl}
            alt={product.name}
            className="w-full h-80 object-cover rounded-lg border border-forest-300"
          />
          {product.videoUrl && (
            <video
              src={product.videoUrl}
              controls
              className="w-full mt-3 rounded-lg border border-forest-300 bg-black"
            />
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-2 mb-2">
            <h1 className="font-display text-2xl text-forest-950">{product.name}</h1>
            {product.qualityGrade && (
              <span className="stamp-verified text-sm px-2 py-1 shrink-0">
                {product.qualityGrade}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-sm text-forest-800/80 mb-4">
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {product.market}
            </span>
            {product.averageRating ? (
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-clay text-clay" />
                {product.averageRating.toFixed(1)} ({product.reviewCount})
              </span>
            ) : null}
          </div>

          <p className="font-mono text-3xl text-forest-800 mb-1">
            {formatPrice(activePrice)}
            {hasPromo && (
              <span className="text-base text-forest-500 line-through ml-2">
                {formatPrice(product.price)}
              </span>
            )}
            <span className="text-sm text-forest-500"> / {product.unit}</span>
          </p>
          {hasPromo && <p className="text-xs text-clay mb-1">{t("product.promoActive")}</p>}
          {tierPrice != null && activePrice === tierPrice && (
            <p className="text-xs text-leaf mb-3">{t("product.bulkApplied")}</p>
          )}

          {hasTiers && (
            <div className="border border-dashed border-forest-300 rounded-md p-3 mb-4 text-sm">
              <p className="font-medium text-forest-800 mb-1">{t("product.bulkTiers")}</p>
              {tiers.map((tier) => (
                <p key={tier.minQuantity} className="text-forest-800/80">
                  {t("product.tierLine", {
                    min: tier.minQuantity,
                    unit: product.unit,
                    price: formatPrice(tier.price),
                  })}
                </p>
              ))}
            </div>
          )}

          <p className="text-forest-800/80 font-body mb-3">{product.description}</p>

          {/* Origin claim — only shown once Admin-verified (FR-41/42/44) */}
          {product.originStatus === "verified" && product.originClaim && (
            <div className="flex items-start gap-2 border border-leaf/40 bg-leaf/5 rounded-md p-3 mb-5">
              <FileCheck size={16} className="text-leaf mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-forest-950">{product.originClaim}</p>
                <p className="text-[11px] text-forest-500">
                  {t("product.originVerifiedNote")}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border border-forest-300 rounded-md">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 hover:bg-forest-300/20"
                aria-label={t("cart.decrease")}
              >
                <Minus size={16} />
              </button>
              <span className="px-4 font-mono">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.quantityAvailable, q + 1))}
                className="p-2 hover:bg-forest-300/20"
                aria-label={t("cart.increase")}
              >
                <Plus size={16} />
              </button>
            </div>
            <span className="text-xs text-forest-500">
              {t("product.available", { qty: product.quantityAvailable, unit: product.unit })}
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={product.quantityAvailable < 1}
            className="w-full bg-forest-800 text-cream py-3 rounded-md font-medium hover:bg-forest-950 transition mb-2 disabled:opacity-50"
          >
            {product.quantityAvailable < 1
              ? t("product.outOfStock")
              : justAdded
              ? t("product.added")
              : t("product.addToCart", { price: formatPrice(activePrice * quantity) })}
          </button>
          <button
            onClick={() => navigate("/cart")}
            className="w-full text-forest-800 text-sm underline mb-3"
          >
            {t("product.viewCart")}
          </button>

          <div className="border-t border-forest-300 pt-4 mt-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-forest-950 flex items-center gap-1">
                {product.sellerName}
                {product.sellerVerified && (
                  <BadgeCheck size={16} className="text-forest-800" />
                )}
              </p>
              {product.sellerTrustScore ? (
                <p className="text-xs text-forest-500">
                  {t("product.trustScore", { score: product.sellerTrustScore.toFixed(1) })}
                </p>
              ) : null}
            </div>
            <button
              onClick={() =>
                navigate(
                  `/messages?with=${product.sellerId}&name=${encodeURIComponent(
                    product.sellerName
                  )}&product=${product.id}`
                )
              }
              className="flex items-center gap-1 text-sm text-forest-800 border border-forest-300 rounded-full px-3 py-1.5 hover:bg-forest-300/20"
            >
              <MessageCircle size={14} /> {t("product.contact")}
            </button>
          </div>
        </div>
      </div>

      {/* Reviews (FR-18) */}
      {reviews.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-xl text-forest-950 mb-4">
            {t("product.reviewsTitle", { count: reviews.length })}
          </h2>
          <div className="flex flex-col gap-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="receipt-stub bg-white border border-forest-300 shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-forest-950">{r.buyerName}</span>
                  <span className="flex items-center gap-0.5 text-clay">
                    {Array.from({ length: r.rating }).map((_, i) => (
                      <Star key={i} size={14} className="fill-clay text-clay" />
                    ))}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-sm text-forest-800/80 font-body">{r.comment}</p>
                )}
                {r.evidence && r.evidence.length > 0 && (
                  <div className="flex gap-2 mt-2">
                    {r.evidence.map((url) => (
                      <img key={url} src={url} alt={t("product.evidenceAlt")} className="w-14 h-14 object-cover rounded border border-forest-300" />
                    ))}
                  </div>
                )}
                {r.sellerResponse && (
                  <div className="mt-2 pl-3 border-l-2 border-forest-300">
                    <p className="text-[11px] text-forest-500">{t("product.sellerResponse")}</p>
                    <p className="text-sm text-forest-800/80">{r.sellerResponse}</p>
                  </div>
                )}
                {isProductSeller && (
                  <div className="flex gap-3 mt-2">
                    <button onClick={() => respond(r.id)} className="text-xs text-forest-800 underline">{t("product.respond")}</button>
                    <button onClick={() => dispute(r.id)} className="text-xs text-clay underline">{t("product.report")}</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
