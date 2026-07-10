import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import { divIcon } from "leaflet";
import type { LatLng } from "../hooks/useSimulatedTracking";

const riderIcon = divIcon({
  className: "",
  html: `<div class="rider-marker">🛵</div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const destinationIcon = divIcon({
  className: "",
  html: `<div class="destination-marker">📍</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

interface Props {
  riderPosition: LatLng;
  destination: LatLng;
  etaMinutes: number;
}

export default function DeliveryTrackingMap({ riderPosition, destination, etaMinutes }: Props) {
  const center: [number, number] = [
    (riderPosition.lat + destination.lat) / 2,
    (riderPosition.lng + destination.lng) / 2,
  ];

  return (
    <div className="rounded-lg overflow-hidden border border-forest-300" style={{ height: 320 }}>
      {/* Fully embedded map — Leaflet.js + OpenStreetMap tiles, per FR-36.
          No Google Maps API, no redirect to any external map app. */}
      <MapContainer center={center} zoom={14} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline
          positions={[
            [riderPosition.lat, riderPosition.lng],
            [destination.lat, destination.lng],
          ]}
          pathOptions={{ color: "#648374", dashArray: "6 8", weight: 3 }}
        />
        <Marker position={[riderPosition.lat, riderPosition.lng]} icon={riderIcon}>
          <Popup>En route — arrivée estimée dans {etaMinutes} min</Popup>
        </Marker>
        <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
          <Popup>Point de livraison</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}