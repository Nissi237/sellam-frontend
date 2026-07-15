import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { Product } from "../types/product";
import { formatPrice } from "../utils/format";
import { BadgeCheck, Megaphone } from "lucide-react";

export default function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation();
  const hasPromo = product.promoPrice != null && product.promoPrice < product.price;
  return (
    <Link
      to={`/product/${product.id}`}
      className="receipt-stub bg-white border border-forest-300 shadow-sm hover:shadow-md transition p-4 flex flex-col"
    >
      <div className="relative">
        <img
          src={product.photoUrl}
          alt={product.name}
          className="w-full h-36 object-cover rounded mb-3"
          loading="lazy"
        />
        {product.sponsored && (
          <span className="absolute top-1 left-1 flex items-center gap-1 bg-forest-950/80 text-cream text-[10px] px-1.5 py-0.5 rounded">
            <Megaphone size={10} /> {t("common.sponsored")}
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

      <div className="flex items-center justify-between text-sm text-forest-800/80">
        <span className="flex items-center gap-1">
          {product.sellerName}
          {product.sellerVerified && (
            <BadgeCheck size={14} className="text-forest-800" />
          )}
        </span>
        <span className="text-xs">{product.market}</span>
      </div>
    </Link>
  );
}