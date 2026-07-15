import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { useCart } from "../context/CartContext";
import { formatPrice } from "../utils/format";

export default function Cart() {
  const { t } = useTranslation();
  const { items, updateQuantity, removeItem, totalAmount } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">{t("cart.empty")}</p>
        <Link to="/browse" className="text-forest-800 underline">
          {t("cart.browseProducts")}
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-2xl mx-auto px-4 py-8">
      <Link
        to="/browse"
        className="inline-flex items-center gap-1 text-sm text-forest-800 hover:text-forest-950 mb-6"
      >
        <ArrowLeft size={16} /> {t("cart.continueShopping")}
      </Link>

      <h1 className="font-display text-2xl text-forest-950 mb-6">{t("cart.title")}</h1>

      <div className="flex flex-col gap-4 mb-6">
        {items.map(({ product, quantity, unitPrice }) => (
          <div
            key={product.id}
            className="receipt-stub bg-white border border-forest-300 shadow-sm p-4 flex items-center gap-4"
          >
            <img
              src={product.photoUrl}
              alt={product.name}
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <p className="font-body font-semibold text-forest-950">{product.name}</p>
              <p className="font-mono text-sm text-forest-800">
                {formatPrice(unitPrice)} / {product.unit}
              </p>
              <p className="text-xs text-forest-500">{product.sellerName} · {product.market}</p>
            </div>
            <div className="flex items-center border border-forest-300 rounded-md">
              <button
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="p-1.5 hover:bg-forest-300/20"
                aria-label={t("cart.decrease")}
              >
                <Minus size={14} />
              </button>
              <span className="px-3 font-mono text-sm">{quantity}</span>
              <button
                onClick={() => updateQuantity(product.id, quantity + 1)}
                className="p-1.5 hover:bg-forest-300/20"
                aria-label={t("cart.increase")}
              >
                <Plus size={14} />
              </button>
            </div>
            <button
              onClick={() => removeItem(product.id)}
              className="text-clay hover:text-clay/70"
              aria-label={t("cart.remove")}
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}
      </div>

      <div className="border-t-2 border-dashed border-forest-300 pt-4 flex items-center justify-between mb-6">
        <span className="font-body text-forest-800">{t("common.total")}</span>
        <span className="font-mono text-2xl text-forest-950">{formatPrice(totalAmount)}</span>
      </div>

      <button
        onClick={() => navigate("/checkout")}
        className="w-full bg-forest-800 text-cream py-3 rounded-md font-medium hover:bg-forest-950 transition"
      >
        {t("cart.checkout")}
      </button>
    </section>
  );
}