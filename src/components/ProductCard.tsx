import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Product } from "../types/product";
import { formatPrice } from "../utils/format";
import { useCart } from "../context/CartContext";
import { BadgeCheck, Megaphone, Star, Plus } from "lucide-react";

const FALLBACK =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80&auto=format&fit=crop";

export default function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation();
  const { addItem } = useCart();

  const hasPromo = product.promoPrice != null && product.promoPrice < product.price;
  const unitPrice = hasPromo ? product.promoPrice! : product.price;
  const discountPct = hasPromo
    ? Math.round(((product.price - product.promoPrice!) / product.price) * 100)
    : 0;
  const outOfStock = product.quantityAvailable <= 0;
  const rating = product.averageRating ?? 0;

  const handleAdd = (e: React.MouseEvent) => {
    // The whole card is a link — keep the click on the button local.
    e.preventDefault();
    e.stopPropagation();
    if (!outOfStock) addItem(product, 1, unitPrice);
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="receipt-stub bg-white border border-forest-300 shadow-sm hover:shadow-md transition p-4 flex flex-col"
    >
      <div className="relative">
        <img
          src={product.photoUrl || FALLBACK}
          onError={(e) => {
            if (e.currentTarget.src !== FALLBACK) e.currentTarget.src = FALLBACK;
          }}
          alt={product.name}
          className={`w-full h-36 object-cover rounded mb-3 ${outOfStock ? "opacity-60" : ""}`}
          loading="lazy"
        />
        {discountPct > 0 && (
          <span className="absolute top-1 left-1 bg-clay text-cream text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded">
            −{discountPct}%
          </span>
        )}
        {product.sponsored && (
          <span className="absolute top-1 right-1 flex items-center gap-1 bg-forest-950/80 text-cream text-[10px] px-1.5 py-0.5 rounded">
            <Megaphone size={10} /> {t("common.sponsored")}
          </span>
        )}
        {outOfStock && (
          <span className="absolute inset-x-1 bottom-1 text-center bg-forest-950/75 text-cream text-[11px] font-mono py-1 rounded">
            {t("common.outOfStock")}
          </span>
        )}
      </div>

      <div className="flex items-start justify-between gap-2 mb-1">
        <h3 className="font-body font-semibold text-forest-950 leading-tight">
          {product.name}
        </h3>
        {product.qualityGrade && (
          <span className="stamp-verified text-xs px-1.5 py-0.5 shrink-0">
            {product.qualityGrade}
          </span>
        )}
      </div>

      {/* Rating (FR-18) — shown only once the product has reviews. */}
      {product.reviewCount ? (
        <div className="flex items-center gap-1 mb-1">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={12}
                className={i < Math.round(rating) ? "text-clay" : "text-forest-300"}
                fill={i < Math.round(rating) ? "currentColor" : "none"}
              />
            ))}
          </div>
          <span className="text-[11px] text-forest-500">({product.reviewCount})</span>
        </div>
      ) : null}

      {hasPromo ? (
        <p className="font-mono text-lg text-clay mb-2">
          {formatPrice(product.promoPrice!)}
          <span className="text-xs text-forest-500 line-through ml-1">
            {formatPrice(product.price)}
          </span>
          <span className="text-xs text-forest-500"> / {product.unit}</span>
        </p>
      ) : (
        <p className="font-mono text-lg text-forest-800 mb-2">
          {formatPrice(product.price)}
          <span className="text-xs text-forest-500"> / {product.unit}</span>
        </p>
      )}

      <div className="border-t border-dashed border-forest-300 my-2" />

      <div className="flex items-center justify-between text-sm text-forest-800/80 mb-3">
        <span className="flex items-center gap-1 min-w-0">
          <span className="truncate">{product.sellerName}</span>
          {product.sellerVerified && (
            <BadgeCheck size={14} className="text-forest-800 shrink-0" />
          )}
        </span>
        <span className="text-xs shrink-0">{product.market}</span>
      </div>

      <button
        onClick={handleAdd}
        disabled={outOfStock}
        className="mt-auto flex items-center justify-center gap-1.5 bg-forest-800 text-cream text-sm font-medium py-2 rounded-md hover:bg-forest-950 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Plus size={15} /> {t("common.add")}
      </button>
    </Link>
  );
}
