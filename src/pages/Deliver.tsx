import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
          {t("deliver.agentOnly")}
        </p>
        <Link to="/login" className="text-forest-800 underline">{t("deliver.loginAsAgent")}</Link>
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
      setNote(t("deliver.geoUnavailable"));
      return;
    }
    setSharingId(job.id);
    setNote(t("deliver.gpsActive"));
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastSent.current < 5000) return;
        lastSent.current = now;
        postLocation(job.id, pos.coords.latitude, pos.coords.longitude).catch(() => {});
      },
      () => setNote(t("deliver.gpsDenied")),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  };

  // Demo fallback: simulate the trip origin -> destination.
  const simulate = (job: DeliveryJob) => {
    stopSharing();
    setSharingId(job.id);
    setNote(t("deliver.simulating"));
    let step = 0;
    const steps = 10;
    simTimer.current = setInterval(async () => {
      step += 1;
      const frac = Math.min(step / steps, 1);
      const lat = job.origin.lat + (job.destination.lat - job.origin.lat) * frac;
      const lng = job.origin.lng + (job.destination.lng - job.origin.lng) * frac;
      await postLocation(job.id, lat, lng).catch(() => {});
      if (frac >= 1) {
        if (simTimer.current) clearInterval(simTimer.current);
        simTimer.current = null;
        setNote(t("deliver.arrived"));
      }
    }, 1500);
  };

  const complete = async (id: string) => {
    stopSharing();
    await markDelivered(id);
    setNote(t("deliver.delivered"));
    load();
  };

  return (
    <section className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl text-forest-950 mb-1 flex items-center gap-2">
        <Bike size={22} /> {t("deliver.title")}
      </h1>
      <p className="text-xs text-forest-500 mb-6">
        {t("deliver.subtitle")}
      </p>
      {note && <p className="text-sm text-forest-800 bg-forest-300/20 rounded-md px-3 py-2 mb-4">{note}</p>}

      {loading ? (
        <p className="text-forest-800/70 font-body py-8 text-center">{t("common.loading")}</p>
      ) : jobs.length === 0 ? (
        <p className="text-forest-800/70 font-body py-8 text-center">
          {t("deliver.noJobs")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {jobs.map((job) => (
            <div key={job.id} className="receipt-stub bg-white border border-forest-300 p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-body font-semibold text-forest-950 flex items-center gap-1">
                    <MapPin size={14} /> {job.deliveryAddress ?? t("deliver.addressUnknown")}
                  </p>
                  <p className="text-xs text-forest-500">
                    {t("deliver.fromTo", { seller: job.sellerName, buyer: job.buyerName, amount: formatPrice(job.totalAmount) })}
                  </p>
                </div>
              </div>

              {!job.mine ? (
                <button
                  onClick={() => claim(job.id)}
                  className="bg-forest-800 text-cream px-4 py-2 rounded-md text-sm font-medium hover:bg-forest-950 transition"
                >
                  {t("deliver.accept")}
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
                    <Navigation size={14} /> {t("deliver.shareLocation")}
                  </button>
                  <button
                    onClick={() => simulate(job)}
                    className="flex items-center gap-1 border border-forest-300 text-forest-800 px-3 py-1.5 rounded-md text-sm hover:bg-forest-300/20 transition"
                  >
                    <Play size={14} /> {t("deliver.simulate")}
                  </button>
                  <button
                    onClick={() => complete(job.id)}
                    className="flex items-center gap-1 bg-forest-800 text-cream px-3 py-1.5 rounded-md text-sm hover:bg-forest-950 transition"
                  >
                    <CheckCircle2 size={14} /> {t("deliver.markDelivered")}
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
