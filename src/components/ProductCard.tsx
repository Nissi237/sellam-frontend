import { Link } from "react-router-dom";
import type { Product } from "../types/product";
import { formatPrice } from "../utils/format";
import { BadgeCheck } from "lucide-react";

export default function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to={`/product/${product.id}`}
      className="receipt-stub bg-white border border-forest-300 shadow-sm hover:shadow-md transition p-4 flex flex-col"
    >
      <img
        src={product.photoUrl}
        alt={product.name}
        className="w-full h-36 object-cover rounded mb-3"
        loading="lazy"
      />

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

      <p className="font-mono text-lg text-forest-800 mb-2">
        {formatPrice(product.price)}
        <span className="text-xs text-forest-500"> / {product.unit}</span>
      </p>

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