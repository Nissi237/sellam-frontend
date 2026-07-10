import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { MapPin, Store, Smartphone, ShieldCheck, ArrowLeft } from "lucide-react";
import { useCart } from "../context/CartContext";
import { useOrders } from "../context/OrderContext";
import { formatPrice } from "../utils/format";

type DeliveryMode = "pickup" | "delivery";
type PaymentProvider = "MTN MoMo" | "Orange Money";
type PaymentState = "form" | "initiating" | "awaiting_pin" | "success";

export default function Checkout() {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const { addOrder } = useOrders();

  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>("delivery");
  const [address, setAddress] = useState("");
  const [provider, setProvider] = useState<PaymentProvider>("MTN MoMo");
  const [phone, setPhone] = useState("");
  const [paymentState, setPaymentState] = useState<PaymentState>("form");

  if (items.length === 0 && paymentState === "form") {
    return (
      <section className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">Votre panier est vide.</p>
        <Link to="/browse" className="text-forest-800 underline">
          Parcourir les produits
        </Link>
      </section>
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (deliveryMode === "delivery" && !address.trim()) return;
    if (!phone.trim()) return;

    // Simulated Mobile Money flow — mirrors the real sequence:
    // initiate request -> phone prompts for PIN -> webhook confirms -> order created
    setPaymentState("initiating");

    setTimeout(() => {
      setPaymentState("awaiting_pin");

      setTimeout(() => {
        const orderId = crypto.randomUUID().slice(0, 8).toUpperCase();

        addOrder({
          id: orderId,
          items: items.map(({ product, quantity, unitPrice }) => ({
            product,
            quantity,
            unitPrice,
          })),
          deliveryMode,
          deliveryAddress: deliveryMode === "delivery" ? address : undefined,
          paymentProvider: provider,
          phone,
          totalAmount,
          status: "Confirmed",
          estimatedWindow: deliveryMode === "delivery" ? "45–90 minutes" : "Prêt dans 30 minutes",
          createdAt: new Date().toISOString(),
        });

        setPaymentState("success");
        clearCart();

        setTimeout(() => navigate(`/order-confirmation/${orderId}`), 600);
      }, 2200);
    }, 1000);
  };

  const inputClass =
    "w-full px-4 py-2 border border-forest-300 rounded-md font-body text-forest-950 focus:outline-none focus:ring-2 focus:ring-forest-800";

  // Payment in progress — show the simulated MoMo/OM confirmation states
  if (paymentState !== "form") {
    return (
      <section className="max-w-md mx-auto px-4 py-20 text-center">
        {paymentState === "initiating" && (
          <>
            <p className="font-body text-forest-800 mb-2">Initialisation du paiement...</p>
            <p className="text-sm text-forest-500">Connexion à {provider}</p>
          </>
        )}
        {paymentState === "awaiting_pin" && (
          <>
            <Smartphone size={40} className="mx-auto text-forest-800 mb-4 animate-pulse" />
            <p className="font-body text-forest-950 font-medium mb-2">
              Vérifiez votre téléphone
            </p>
            <p className="text-sm text-forest-800/80">
              Composez votre code {provider} pour confirmer le paiement de{" "}
              <span className="font-mono">{formatPrice(totalAmount)}</span>
            </p>
          </>
        )}
        {paymentState === "success" && (
          <>
            <ShieldCheck size={40} className="mx-auto text-leaf mb-4" />
            <p className="font-body text-forest-950 font-medium">Paiement confirmé ✓</p>
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
        <ArrowLeft size={16} /> Retour au panier
      </Link>

      <h1 className="font-display text-2xl text-forest-950 mb-6">Paiement</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Delivery method, per FR-8/FR-16 */}
        <div>
          <p className="text-sm font-medium text-forest-800 mb-2">Mode de livraison</p>
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
              <span className="text-sm">Livraison</span>
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
              <span className="text-sm">Retrait au marché</span>
            </button>
          </div>
        </div>

        {deliveryMode === "delivery" && (
          <textarea
            placeholder="Adresse de livraison (quartier, points de repère...)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
            rows={2}
            required
          />
        )}

        {/* Payment method, per FR-14 */}
        <div>
          <p className="text-sm font-medium text-forest-800 mb-2">Mode de paiement</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setProvider("MTN MoMo")}
              className={`py-3 rounded-md border text-sm transition ${
                provider === "MTN MoMo"
                  ? "bg-forest-800 text-cream border-forest-800"
                  : "border-forest-300 text-forest-800"
              }`}
            >
              MTN MoMo
            </button>
            <button
              type="button"
              onClick={() => setProvider("Orange Money")}
              className={`py-3 rounded-md border text-sm transition ${
                provider === "Orange Money"
                  ? "bg-forest-800 text-cream border-forest-800"
                  : "border-forest-300 text-forest-800"
              }`}
            >
              Orange Money
            </button>
          </div>
        </div>

        <input
          type="tel"
          placeholder="Numéro Mobile Money (+237...)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          required
        />

        <div className="border-t-2 border-dashed border-forest-300 pt-4 flex items-center justify-between">
          <span className="font-body text-forest-800">Total</span>
          <span className="font-mono text-2xl text-forest-950">{formatPrice(totalAmount)}</span>
        </div>

        <button
          type="submit"
          className="bg-forest-800 text-cream py-3 rounded-md font-medium hover:bg-forest-950 transition"
        >
          Payer {formatPrice(totalAmount)}
        </button>
      </form>
    </section>
  );
}