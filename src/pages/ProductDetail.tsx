import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BadgeCheck, Star, MapPin, MessageCircle, ArrowLeft, Minus, Plus } from "lucide-react";
import { mockProducts } from "../data/mockProducts";
import { formatPrice } from "../utils/format";
import { useCart } from "../context/CartContext";

export default function ProductDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  // TODO (backend): replace with GET /products/:id
  const product = mockProducts.find((p) => p.id === id);

  if (!product) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">Produit introuvable.</p>
        <Link to="/browse" className="text-forest-800 underline">
          {t("nav.browse")}
        </Link>
      </section>
    );
  }

  const activePrice = product.bulkPriceTiers
    ? [...product.bulkPriceTiers]
        .sort((a, b) => b.minQuantity - a.minQuantity)
        .find((tier) => quantity >= tier.minQuantity)?.price ?? product.price
    : product.price;

  const handleAddToCart = () => {
    addItem(product, quantity, activePrice);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
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
            {product.averageRating && (
              <span className="flex items-center gap-1">
                <Star size={14} className="fill-clay text-clay" />
                {product.averageRating.toFixed(1)} ({product.reviewCount})
              </span>
            )}
          </div>

          <p className="font-mono text-3xl text-forest-800 mb-1">
            {formatPrice(activePrice)}
            <span className="text-sm text-forest-500"> / {product.unit}</span>
          </p>
          {activePrice !== product.price && (
            <p className="text-xs text-leaf mb-3">Prix de gros appliqué ✓</p>
          )}

          {product.bulkPriceTiers && (
            <div className="border border-dashed border-forest-300 rounded-md p-3 mb-4 text-sm">
              <p className="font-medium text-forest-800 mb-1">Tarifs dégressifs :</p>
              {product.bulkPriceTiers.map((tier) => (
                <p key={tier.minQuantity} className="text-forest-800/80">
                  À partir de {tier.minQuantity} {product.unit}s — {formatPrice(tier.price)} / {product.unit}
                </p>
              ))}
            </div>
          )}

          <p className="text-forest-800/80 font-body mb-5">{product.description}</p>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border border-forest-300 rounded-md">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="p-2 hover:bg-forest-300/20"
                aria-label="Diminuer la quantité"
              >
                <Minus size={16} />
              </button>
              <span className="px-4 font-mono">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.quantityAvailable, q + 1))}
                className="p-2 hover:bg-forest-300/20"
                aria-label="Augmenter la quantité"
              >
                <Plus size={16} />
              </button>
            </div>
            <span className="text-xs text-forest-500">
              {product.quantityAvailable} {product.unit}s disponibles
            </span>
          </div>

          <button
            onClick={handleAddToCart}
            className="w-full bg-forest-800 text-cream py-3 rounded-md font-medium hover:bg-forest-950 transition mb-2"
          >
            {justAdded ? "Ajouté ✓" : `Ajouter au panier — ${formatPrice(activePrice * quantity)}`}
          </button>
          <button
            onClick={() => navigate("/cart")}
            className="w-full text-forest-800 text-sm underline mb-3"
          >
            Voir le panier
          </button>

          <div className="border-t border-forest-300 pt-4 mt-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-forest-950 flex items-center gap-1">
                {product.sellerName}
                {product.sellerVerified && (
                  <BadgeCheck size={16} className="text-forest-800" />
                )}
              </p>
              {product.sellerTrustScore && (
                <p className="text-xs text-forest-500">
                  Score de confiance : {product.sellerTrustScore.toFixed(1)}/5
                </p>
              )}
            </div>
            <button className="flex items-center gap-1 text-sm text-forest-800 border border-forest-300 rounded-full px-3 py-1.5 hover:bg-forest-300/20">
              <MessageCircle size={14} /> Contacter
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}