import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Package, CheckCircle2, Truck, Star, MapPin } from "lucide-react";
import { fetchOrder, createReview, getTracking, type TrackingState } from "../api/endpoints";
import type { Order } from "../types/order";
import { formatPrice } from "../utils/format";
import { apiError } from "../api/client";
import { usePolling } from "../hooks/usePolling";
import DeliveryTrackingMap from "../components/DeliveryTrackingMap";

const STEPS: { key: string; labelKey: string; icon: typeof Package }[] = [
  { key: "confirmed", labelKey: "order.stepConfirmed", icon: CheckCircle2 },
  { key: "out_for_delivery", labelKey: "order.stepOutForDelivery", icon: Truck },
  { key: "delivered", labelKey: "order.stepDelivered", icon: Package },
];

function stepIndex(status: string): number {
  if (status === "placed" || status === "confirmed") return 0;
  if (status === "out_for_delivery") return 1;
  if (status === "delivered") return 2;
  return -1;
}

export default function OrderTracking() {
  const { t } = useTranslation();
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

  // Delivery tracking (FR-33/35). The API is serverless, so there is no order
  // room to subscribe to — poll the rider position + ETA while the order is out
  // for delivery. Once it is delivered, refresh the order once and stop.
  const trackingActive = !!id && order?.status === "out_for_delivery";
  usePolling(
    () => {
      if (!id) return;
      getTracking(id)
        .then((next) => {
          setTracking(next);
          if (next.status === "delivered") load();
        })
        .catch(() => {});
    },
    5000,
    trackingActive
  );

  // Fetch the map state once for an already-delivered order (no polling needed).
  useEffect(() => {
    if (!id || order?.status !== "delivered") return;
    getTracking(id).then(setTracking).catch(() => {});
  }, [id, order?.status]);

  if (loading) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body">{t("common.loading")}</p>
      </section>
    );
  }

  if (!order) {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">{t("order.notFound")}</p>
        <Link to="/browse" className="text-forest-800 underline">
          {t("cart.browseProducts")}
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
      setReviewError(t("order.evidenceRequired"));
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
      <h1 className="font-display text-2xl text-forest-950 mb-1">{t("order.trackTitle")}</h1>
      <p className="text-sm text-forest-500 font-mono mb-6">
        #{order.id.slice(0, 8).toUpperCase()} · {order.sellerName}
      </p>

      {cancelled ? (
        <div className="receipt-stub bg-white border border-clay/40 p-6 text-center mb-6">
          <p className="text-clay font-medium">{t("order.cancelled")}</p>
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
                    {t(step.labelKey)}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-forest-500 mt-5 flex items-center gap-1 justify-center">
            <MapPin size={12} />
            {order.deliveryMode === "delivery"
              ? t("order.deliveryWindow", { window: order.estimatedWindow })
              : t("order.pickupWindow", { window: order.estimatedWindow })}
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
                <Truck size={16} /> {t("order.riderOnWay", { name: tracking.agentName ?? t("order.rider") })}
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
          <span className="font-body text-forest-800">{t("common.total")}</span>
          <span className="font-mono text-lg text-forest-950">
            {formatPrice(order.totalAmount)}
          </span>
        </div>
      </div>

      {/* Verified-purchase review (FR-18/37) — only once delivered */}
      {order.status === "delivered" && !reviewDone && (
        <div className="receipt-stub bg-white border border-forest-300 shadow-sm p-6">
          <h2 className="font-display text-lg text-forest-950 mb-3">{t("order.leaveReview")}</h2>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={t("order.starsLabel", { n })}
              >
                <Star
                  size={24}
                  className={n <= rating ? "fill-clay text-clay" : "text-forest-300"}
                />
              </button>
            ))}
          </div>
          <textarea
            placeholder={t("order.commentPlaceholder")}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800 mb-3"
            rows={2}
          />
          {needsEvidence && (
            <div className="mb-3">
              <input
                type="url"
                placeholder={t("order.evidencePlaceholder")}
                value={evidenceUrl}
                onChange={(e) => setEvidenceUrl(e.target.value)}
                className="w-full px-3 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800"
              />
              <p className="text-[11px] text-forest-500 mt-1">
                {t("order.evidenceNote")}
              </p>
            </div>
          )}
          {reviewError && <p className="text-clay text-sm mb-2">{reviewError}</p>}
          <button
            onClick={submitReview}
            className="w-full bg-forest-800 text-cream py-2.5 rounded-md font-medium hover:bg-forest-950 transition"
          >
            {t("order.publishReview")}
          </button>
        </div>
      )}

      {reviewDone && (
        <div className="receipt-stub bg-white border border-leaf/40 p-6 text-center">
          <p className="text-leaf font-medium">
            {reviewHeld ? t("order.reviewHeld") : t("order.reviewThanks")}
          </p>
        </div>
      )}
    </section>
  );
}
