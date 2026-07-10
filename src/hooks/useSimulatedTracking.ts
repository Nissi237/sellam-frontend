import { useEffect, useState } from "react";

export interface LatLng {
  lat: number;
  lng: number;
}

export type TrackingStatus = "confirmed" | "preparing" | "out_for_delivery" | "delivered";

// TODO (backend): this whole hook is a stand-in for the real flow described in
// Section 5.3 / FR-33/34 of the SRS: the Delivery Partner's device streams real
// GPS coordinates via Socket.io every 5-10s (throttled, per NFR-12/13), the
// backend logs each ping to DeliveryTracking, and broadcasts it to the buyer's
// browser. This hook simulates that same event pattern locally — smoothly
// interpolating position client-side between "pings", exactly like a real
// implementation would — so swapping in a real `socket.on("location", ...)`
// listener later is a drop-in replacement, not a rewrite.
export function useSimulatedTracking(origin: LatLng, destination: LatLng, durationSeconds = 45) {
  const [status, setStatus] = useState<TrackingStatus>("confirmed");
  const [position, setPosition] = useState<LatLng>(origin);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const toPreparing = setTimeout(() => setStatus("preparing"), 2500);
    const toOutForDelivery = setTimeout(() => setStatus("out_for_delivery"), 5000);
    return () => {
      clearTimeout(toPreparing);
      clearTimeout(toOutForDelivery);
    };
  }, []);

  useEffect(() => {
    if (status !== "out_for_delivery") return;

    const stepMs = 1000; // smooth client-side animation
    const totalSteps = durationSeconds;
    let step = 0;

    const interval = setInterval(() => {
      step += 1;
      const t = Math.min(step / totalSteps, 1);
      setProgress(t);
      setPosition({
        lat: origin.lat + (destination.lat - origin.lat) * t,
        lng: origin.lng + (destination.lng - origin.lng) * t,
      });

      if (t >= 1) {
        clearInterval(interval);
        setStatus("delivered");
      }
    }, stepMs);

    return () => clearInterval(interval);
  }, [status, origin, destination, durationSeconds]);

  const etaMinutes = Math.max(0, Math.ceil((durationSeconds * (1 - progress)) / 60) || 1);

  return { status, position, progress, etaMinutes };
}