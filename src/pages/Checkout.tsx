import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { MapPin, Store, Smartphone, ShieldCheck, ArrowLeft, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { formatPrice } from "../utils/format";
import { createOrder, verifyPayment, fetchMomoAccounts, type MomoAccount } from "../api/endpoints";
import { apiError } from "../api/client";
import MomoAccounts from "../components/MomoAccounts";

type DeliveryMode = "pickup" | "delivery";
type PaymentState = "form" | "initiating" | "awaiting_pin" | "success";

export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("delivery");
  const [address, setAddress] = useState("");
  const [accounts, setAccounts] = useState<MomoAccount[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [showAdd, setShowAdd] = useState(false);
  const [paymentState, setPaymentState] = useState<PaymentState>("form");
  const [ussd, setUssd] = useState<string | null>(null);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    fetchMomoAccounts()
      .then((a) => {
        setAccounts(a);
        const def = a.find((x) => x.isDefault) ?? a[0];
        if (def) setSelectedId(def.id);
        if (a.length === 0) setShowAdd(true);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  // Not logged in → can't check out (orders are tied to a buyer account).
  if (!isAuthenticated) {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">
          {t("checkout.loginToOrder")}
        </p>
        <Link to="/login" className="text-forest-800 underline">
          {t("common.loginLink")}
        </Link>
      </section>
    );
  }

  if (items.length === 0 && paymentState === "form") {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">{t("cart.empty")}</p>
        <Link to="/browse" className="text-forest-800 underline">
          {t("cart.browseProducts")}
        </Link>
      </section>
    );
  }

  const selected = accounts.find((a) => a.id === selectedId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (deliveryMode === "delivery" && !address.trim()) {
      setError(t("checkout.addressRequired"));
      return;
    }
    if (!selected) {
      setError(t("checkout.selectMomo"));
      return;
    }

    setPaymentState("initiating");
    (async () => {
      try {
        const orders = await createOrder({
          items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
          deliveryMode,
          deliveryAddress: deliveryMode === "delivery" ? address.trim() : undefined,
          paymentProvider: selected.provider,
          payerMomoNumber: selected.momoNumber,
        });
        const order = orders[0];
        clearCart();

        if (order.paymentStatus === "held_escrow") {
          // Demo mode — payment already settled.
          setPaymentState("success");
          setTimeout(() => navigate(`/order-confirmation/${order.id}`), 700);
          return;
        }

        // Real Mobile Money (Monetbil): the payer must approve on their phone.
        setUssd(order.channelUssd ?? null);
        setPaymentState("awaiting_pin");
        let tries = 0;
        pollRef.current = setInterval(async () => {
          tries += 1;
          try {
            const { paymentStatus } = await verifyPayment(order.id);
            if (paymentStatus === "held_escrow") {
              if (pollRef.current) clearInterval(pollRef.current);
              setPaymentState("success");
              setTimeout(() => navigate(`/order-confirmation/${order.id}`), 700);
            } else if (paymentStatus === "failed") {
              if (pollRef.current) clearInterval(pollRef.current);
              setError(t("checkout.payFailed"));
              setPaymentState("form");
            }
          } catch {
            /* keep polling */
          }
          if (tries >= 20) {
            if (pollRef.current) clearInterval(pollRef.current);
            setError(t("checkout.payTimeout"));
            setPaymentState("form");
          }
        }, 3000);
      } catch (err) {
        setError(apiError(err, t("checkout.payError")));
        setPaymentState("form");
      }
    })();
  };

  const inputClass =
    "w-full px-4 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800";

  if (paymentState !== "form") {
    return (
      <section className="max-w-md mx-auto px-4 py-20 text-center">
        {paymentState === "initiating" && (
          <>
            <p className="font-body text-forest-800 mb-2">{t("checkout.initiating")}</p>
            <p className="text-sm text-forest-500">{t("checkout.connectingTo", { provider: selected?.provider })}</p>
          </>
        )}
        {paymentState === "awaiting_pin" && (
          <>
            <Smartphone size={40} className="mx-auto text-forest-800 mb-4 animate-pulse" />
            <p className="font-body text-forest-950 font-medium mb-2">{t("checkout.checkPhone")}</p>
            <p className="text-sm text-forest-800/80">
              {t("checkout.requestSent", { price: formatPrice(totalAmount), provider: selected?.provider })}
            </p>
            {ussd && (
              <p className="mt-4 text-sm text-forest-800/80">
                {t("checkout.ussdHint")}
                <br />
                <span className="font-mono text-lg text-forest-950 tracking-wide">{ussd}</span>
              </p>
            )}
            <p className="mt-4 text-xs text-forest-500">{t("checkout.awaitingConfirm")}</p>
          </>
        )}
        {paymentState === "success" && (
          <>
            <ShieldCheck size={40} className="mx-auto text-leaf mb-4" />
            <p className="font-body text-forest-950 font-medium">{t("checkout.confirmed")}</p>
          </>
        )}
      </section>
    );
  }

  return (
    <section className="max-w-xl mx-auto px-4 py-8">
      <Link
        to="/cart"
        className="inline-flex items-center gap-1 text-sm text-forest-800 hover:text-forest-950 mb-6"
      >
        <ArrowLeft size={16} /> {t("checkout.backToCart")}
      </Link>

      <h1 className="font-display text-2xl text-forest-950 mb-6">{t("checkout.title")}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Delivery method (FR-8/FR-16) */}
        <div>
          <p className="text-sm font-medium text-forest-800 mb-2">{t("checkout.deliveryMode")}</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDeliveryMode("delivery")}
              className={`flex flex-col items-center gap-1 py-3 rounded-md border transition ${
                deliveryMode === "delivery"
                  ? "bg-forest-800 text-cream border-forest-800"
                  : "border-forest-300 text-forest-800"
              }`}
            >
              <MapPin size={18} />
              <span className="text-sm">{t("checkout.delivery")}</span>
            </button>
            <button
              type="button"
              onClick={() => setDeliveryMode("pickup")}
              className={`flex flex-col items-center gap-1 py-3 rounded-md border transition ${
                deliveryMode === "pickup"
                  ? "bg-forest-800 text-cream border-forest-800"
                  : "border-forest-300 text-forest-800"
              }`}
            >
              <Store size={18} />
              <span className="text-sm">{t("checkout.pickup")}</span>
            </button>
          </div>
        </div>

        {deliveryMode === "delivery" && (
          <textarea
            placeholder={t("checkout.addressPlaceholder")}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
            rows={2}
          />
        )}

        {/* Mobile Money account (FR-14) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-forest-800">{t("checkout.momoAccount")}</p>
            <button
              type="button"
              onClick={() => setShowAdd((s) => !s)}
              className="text-xs text-forest-800 flex items-center gap-1 underline"
            >
              <Plus size={12} /> {t("checkout.add")}
            </button>
          </div>

          {accounts.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {accounts.map((a) => (
                <label
                  key={a.id}
                  className={`flex items-center gap-3 border rounded-md px-3 py-2 cursor-pointer ${
                    selectedId === a.id ? "border-forest-800 bg-forest-300/10" : "border-forest-300"
                  }`}
                >
                  <input
                    type="radio"
                    name="momo"
                    checked={selectedId === a.id}
                    onChange={() => setSelectedId(a.id)}
                  />
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      a.provider === "MTN MoMo"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {a.provider === "MTN MoMo" ? "MTN" : "Orange"}
                  </span>
                  <span className="font-mono text-sm text-forest-950">{a.momoNumber}</span>
                </label>
              ))}
            </div>
          )}

          {(showAdd || accounts.length === 0) && (
            <div className="border border-dashed border-forest-300 rounded-md p-3">
              <p className="text-xs text-forest-500 mb-2">
                {t("checkout.linkMomo")}
              </p>
              <MomoAccounts
                compact
                onChange={(a) => {
                  setAccounts(a);
                  if (!selectedId && a.length > 0) setSelectedId((a.find((x) => x.isDefault) ?? a[0]).id);
                }}
              />
            </div>
          )}
        </div>

        <div className="border-t-2 border-dashed border-forest-300 pt-4 flex items-center justify-between">
          <span className="font-body text-forest-800">{t("common.total")}</span>
          <span className="font-mono text-2xl text-forest-950">{formatPrice(totalAmount)}</span>
        </div>

        {error && <p className="text-clay text-sm">{error}</p>}

        <button
          type="submit"
          disabled={!selected}
          className="bg-forest-800 text-cream py-3 rounded-md font-medium hover:bg-forest-950 transition disabled:opacity-50"
        >
          {t("checkout.pay", { price: formatPrice(totalAmount) })}
        </button>
      </form>
    </section>
  );
}
