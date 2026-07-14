import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Package, CheckCircle2, Truck, Star, MapPin } from "lucide-react";
import { fetchOrder, createReview, getTracking, type TrackingState } from "../api/endpoints";
import type { Order } from "../types/order";
import { formatPrice } from "../utils/format";
import { apiError } from "../api/client";
import { getSocket } from "../lib/socket";
import DeliveryTrackingMap from "../components/DeliveryTrackingMap";

const STEPS: { key: string; label: string; icon: typeof Package }[] = [
  { key: "confirmed", label: "Confirmée", icon: CheckCircle2 },
  { key: "out_for_delivery", label: "En livraison", icon: Truck },
  { key: "delivered", label: "Livrée", icon: Package },
];

function stepIndex(status: string): number {
  if (status === "placed" || status === "confirmed") return 0;
  if (status === "out_for_delivery") return 1;
  if (status === "delivered") return 2;
  return -1;
}

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [reviewDone, setReviewDone] = useState(false);
  const [reviewHeld, setReviewHeld] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [tracking, setTracking] = useState<TrackingState | null>(null);

  const load = () => {
    if (!id) return;
    fetchOrder(id)
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Live delivery tracking (FR-33/35): fetch initial map state, then subscribe
  // to the order room for real-time rider position + ETA updates.
  useEffect(() => {
    if (!id || !order) return;
    if (order.status !== "out_for_delivery" && order.status !== "delivered") return;

    getTracking(id).then(setTracking).catch(() => {});

    const socket = getSocket();
    socket.emit("tracking:join", id);
    const onUpdate = (u: { lat?: number; lng?: number; etaMinutes?: number | null; status?: string }) => {
      if (u.status === "delivered") {
        load();
        return;
      }
      if (typeof u.lat === "number" && typeof u.lng === "number") {
        setTracking((prev) =>
          prev
            ? { ...prev, riderPosition: { lat: u.lat!, lng: u.lng! }, etaMinutes: u.etaMinutes ?? prev.etaMinutes }
            : prev
        );
      }
    };
    socket.on("tracking:update", onUpdate);
    return () => {
      socket.emit("tracking:leave", id);
      socket.off("tracking:update", onUpdate);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, order?.status]);

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

  const current = stepIndex(order.status);
  const cancelled = order.status === "cancelled";

  const needsEvidence = rating <= 2;
  const submitReview = async () => {
    setReviewError("");
    if (needsEvidence && !evidenceUrl.trim()) {
      setReviewError("Une photo justificative est requise pour un avis négatif.");
      return;
    }
    try {
      const res = await createReview({
        orderId: order.id,
        productId: order.items[0]?.productId ?? undefined,
        rating,
        comment: comment.trim() || undefined,
        evidencePhotos: evidenceUrl.trim() ? [evidenceUrl.trim()] : undefined,
      });
      setReviewHeld(res.held);
      setReviewDone(true);
    } catch (err) {
      setReviewError(apiError(err));
    }
  };

  return (
    <section className="max-w-xl mx-auto px-4 py-10">
      <h1 className="font-display text-2xl text-forest-950 mb-1">Suivi de commande</h1>
      <p className="text-sm text-forest-500 font-mono mb-6">
        #{order.id.slice(0, 8).toUpperCase()} · {order.sellerName}
      </p>

      {cancelled ? (
        <div className="receipt-stub bg-white border border-clay/40 p-6 text-center mb-6">
          <p className="text-clay font-medium">Commande annulée · paiement remboursé</p>
        </div>
      ) : (
        <div className="receipt-stub bg-white border border-forest-300 shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const done = i <= current;
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative">
                  {i > 0 && (
                    <div
                      className={`absolute top-4 right-1/2 w-full h-0.5 ${
                        i <= current ? "bg-forest-800" : "bg-forest-300"
                      }`}
                    />
                  )}
                  <div
                    className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center ${
                      done ? "bg-forest-800 text-cream" : "bg-forest-300/40 text-forest-500"
                    }`}
                  >
                    <Icon size={16} />
                  </div>
                  <span
                    className={`text-xs mt-2 ${done ? "text-forest-950" : "text-forest-500"}`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-forest-500 mt-5 flex items-center gap-1 justify-center">
            <MapPin size={12} />
            {order.deliveryMode === "delivery"
              ? `Livraison — ${order.estimatedWindow}`
              : `Retrait — ${order.estimatedWindow}`}
          </p>
        </div>
      )}

      {/* Live delivery map (FR-33/36) — Leaflet + OpenStreetMap, no external map. */}
      {order.status === "out_for_delivery" &&
        order.deliveryMode === "delivery" &&
        tracking?.riderPosition &&
        tracking?.destination && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-forest-800 flex items-center gap-1">
                <Truck size={16} /> {tracking.agentName ?? "Livreur"} en route
              </p>
              {tracking.etaMinutes != null && (
                <span className="text-sm font-mono text-forest-950">
                  ~{tracking.etaMinutes} min
                </span>
              )}
            </div>
            <DeliveryTrackingMap
              riderPosition={tracking.riderPosition}
              destination={tracking.destination}
              etaMinutes={tracking.etaMinutes ?? 0}
            />
          </div>
        )}

      {/* Items */}
      <div className="receipt-stub bg-white border border-forest-300 shadow-sm p-6 mb-6">
        <div className="flex flex-col gap-2">
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
          <span className="font-body text-forest-800">Total</span>
          <span className="font-mono text-lg text-forest-950">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Verified-purchase review (FR-18/37) — only once delivered */}
      {order.status === "delivered" && !reviewDone && (
        <div className="receipt-stub bg-white border border-forest-300 shadow-sm p-6">
          <h2 className="font-display text-lg text-forest-950 mb-3">Laisser un avis</h2>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} étoiles`}
              >
                <Star
                  size={24}
                  className={n <= rating ? "fill-clay text-clay" : "text-forest-300"}
                />
              </button>
            ))}
          </div>
          <textarea
            placeholder="Votre commentaire (optionnel)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800 mb-3"
            rows={2}
          />
          {needsEvidence && (
            <div className="mb-3">
              <input
                type="url"
                placeholder="Lien d'une photo justificative (obligatoire)"
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="w-full px-3 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
              />
              <p className="text-[11px] text-forest-500 mt-1">
                Une preuve est requise pour un avis 1–2 étoiles (FR-38).
              </p>
            </div>
          )}
          {reviewError && <p className="text-clay text-sm mb-2">{reviewError}</p>}
          <button
            onClick={submitReview}
            className="w-full bg-forest-800 text-cream py-2.5 rounded-md font-medium hover:bg-forest-950 transition"
          >
            Publier mon avis
          </button>
        </div>
      )}

      {reviewDone && (
        <div className="receipt-stub bg-white border border-leaf/40 p-6 text-center">
          <p className="text-leaf font-medium">
            {reviewHeld ? "Merci — votre avis est en cours de vérification." : "Merci pour votre avis ✓"}
          </p>
        </div>
      )}
    </section>
  );
}
