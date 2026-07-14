import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bike, MapPin, Navigation, Play, CheckCircle2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  fetchAvailableDeliveries,
  claimDelivery,
  postLocation,
  markDelivered,
  type DeliveryJob,
} from "../api/endpoints";
import { formatPrice } from "../utils/format";

export default function Deliver() {
  const { user, isAuthenticated } = useAuth();
  const [jobs, setJobs] = useState<DeliveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const watchId = useRef<number | null>(null);
  const simTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastSent = useRef(0);

  const load = () =>
    fetchAvailableDeliveries()
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    if (isAuthenticated && user?.role === "delivery_agent") load();
    else setLoading(false);
    return () => stopSharing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.role]);

  if (!isAuthenticated || user?.role !== "delivery_agent") {
    return (
      <section className="max-w-md mx-auto px-4 py-16 text-center">
        <p className="text-forest-800/70 font-body mb-4">
          Cet espace est réservé aux livreurs partenaires.
        </p>
        <Link to="/login" className="text-forest-800 underline">Se connecter comme livreur</Link>
      </section>
    );
  }

  const stopSharing = () => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    if (simTimer.current) {
      clearInterval(simTimer.current);
      simTimer.current = null;
    }
    setSharingId(null);
  };

  const claim = async (id: string) => {
    await claimDelivery(id);
    load();
  };

  // FR-34: stream real GPS via the Geolocation API (throttled ~5s, NFR-13).
  const shareGps = (job: DeliveryJob) => {
    stopSharing();
    if (!navigator.geolocation) {
      setNote("Géolocalisation indisponible — utilisez la simulation.");
      return;
    }
    setSharingId(job.id);
    setNote("Partage GPS actif…");
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent.current < 5000) return;
        lastSent.current = now;
        postLocation(job.id, pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      () => setNote("Accès GPS refusé — utilisez la simulation."),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  // Demo fallback: simulate the trip origin -> destination.
  const simulate = (job: DeliveryJob) => {
    stopSharing();
    setSharingId(job.id);
    setNote("Simulation du trajet…");
    let step = 0;
    const steps = 10;
    simTimer.current = setInterval(async () => {
      step += 1;
      const t = Math.min(step / steps, 1);
      const lat = job.origin.lat + (job.destination.lat - job.origin.lat) * t;
      const lng = job.origin.lng + (job.destination.lng - job.origin.lng) * t;
      await postLocation(job.id, lat, lng).catch(() => {});
      if (t >= 1) {
        if (simTimer.current) clearInterval(simTimer.current);
        simTimer.current = null;
        setNote("Arrivé à destination — marquez la commande livrée.");
      }
    }, 1500);
  };

  const complete = async (id: string) => {
    stopSharing();
    await markDelivered(id);
    setNote("Commande livrée ✓");
    load();
  };

  return (
    <section className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl text-forest-950 mb-1 flex items-center gap-2">
        <Bike size={22} /> Mes livraisons
      </h1>
      <p className="text-xs text-forest-500 mb-6">
        Acceptez une course, partagez votre position en direct, puis confirmez la livraison.
      </p>
      {note && <p className="text-sm text-forest-800 bg-forest-300/20 rounded-md px-3 py-2 mb-4">{note}</p>}

      {loading ? (
        <p className="text-forest-800/70 font-body py-8 text-center">Chargement…</p>
      ) : jobs.length === 0 ? (
        <p className="text-forest-800/70 font-body py-8 text-center">
          Aucune commande à livrer pour le moment.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div key={job.id} className="receipt-stub bg-white border border-forest-300 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-body font-semibold text-forest-950 flex items-center gap-1">
                    <MapPin size={14} /> {job.deliveryAddress ?? "Adresse non précisée"}
                  </p>
                  <p className="text-xs text-forest-500">
                    De {job.sellerName} · pour {job.buyerName} · {formatPrice(job.totalAmount)}
                  </p>
                </div>
              </div>

              {!job.mine ? (
                <button
                  onClick={() => claim(job.id)}
                  className="bg-forest-800 text-cream px-4 py-2 rounded-md text-sm font-medium hover:bg-forest-950 transition"
                >
                  Accepter la course
                </button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => shareGps(job)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition ${
                      sharingId === job.id
                        ? "bg-leaf/20 text-leaf"
                        : "border border-forest-300 text-forest-800 hover:bg-forest-300/20"
                    }`}
                  >
                    <Navigation size={14} /> Partager ma position
                  </button>
                  <button
                    onClick={() => simulate(job)}
                    className="flex items-center gap-1 border border-forest-300 text-forest-800 px-3 py-1.5 rounded-md text-sm hover:bg-forest-300/20 transition"
                  >
                    <Play size={14} /> Simuler le trajet
                  </button>
                  <button
                    onClick={() => complete(job.id)}
                    className="flex items-center gap-1 bg-forest-800 text-cream px-3 py-1.5 rounded-md text-sm hover:bg-forest-950 transition"
                  >
                    <CheckCircle2 size={14} /> Marquer livré
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
