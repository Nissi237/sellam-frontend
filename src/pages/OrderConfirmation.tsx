import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle2, Clock, MapPin, Store } from "lucide-react";
import { fetchOrder } from "../api/endpoints";
import type { Order } from "../types/order";
import { formatPrice } from "../utils/format";

export default function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchOrder(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body">Chargement…</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">Commande introuvable.</p>
        <Link to="/browse" className="text-forest-800 underline">
          Parcourir les produits
        </Link>
      </section>
    );
  }

  return (
    <section className="max-w-xl mx-auto px-4 py-12">
      <div className="receipt-stub bg-white border border-forest-300 shadow-sm p-6 text-center mb-6">
        <CheckCircle2 size={44} className="mx-auto text-leaf mb-3" />
        <h1 className="font-display text-xl text-forest-950 mb-1">Commande confirmée</h1>
        <p className="text-sm text-forest-500 font-mono">
          #{order.id.slice(0, 8).toUpperCase()}
        </p>
      </div>

      <div className="receipt-stub bg-white border border-forest-300 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 text-forest-800 mb-4">
          {order.deliveryMode === "delivery" ? <MapPin size={18} /> : <Store size={18} />}
          <span className="font-body">
            {order.deliveryMode === "delivery" ? order.deliveryAddress : "Retrait au marché"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-forest-800 mb-4">
          <Clock size={18} />
          <span className="font-body">Estimé : {order.estimatedWindow}</span>
        </div>

        <div className="border-t border-dashed border-forest-300 pt-4 flex flex-col gap-2">
          {order.items.map((it) => (
            <div key={it.id ?? it.productName} className="flex justify-between text-sm">
              <span className="text-forest-800">
                {it.quantity} × {it.productName}
              </span>
              <span className="font-mono text-forest-950">
                {formatPrice(it.unitPrice * it.quantity)}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t-2 border-dashed border-forest-300 pt-3 mt-3 flex justify-between">
          <span className="font-body text-forest-800">
            Total payé ({order.paymentProvider})
          </span>
          <span className="font-mono text-lg text-forest-950">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      <Link
        to={`/order-tracking/${order.id}`}
        className="block text-center border border-forest-800 text-forest-800 py-3 rounded-md font-medium hover:bg-forest-300/20 transition mb-3"
      >
        Suivre ma commande
      </Link>

      <Link
        to="/browse"
        className="block text-center bg-forest-800 text-cream py-3 rounded-md font-medium hover:bg-forest-950 transition"
      >
        Continuer mes achats
      </Link>
    </section>
  );
}
