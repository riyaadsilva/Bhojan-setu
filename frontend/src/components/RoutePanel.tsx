import type { NGO } from "../data/ngos";
import { googleMapsRouteUrl, LatLng, RouteInfo } from "../services/maps";

interface RoutePanelProps {
  pickup?: LatLng | null;
  ngo?: NGO | null;
  routeInfo?: RouteInfo | null;
  onGetRoute: () => void;
}

const action = {
  background: "#FF5722",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 700,
  fontSize: "0.84rem",
} as const;

const ghost = {
  ...action,
  background: "transparent",
  border: "1px solid rgba(255,255,255,0.18)",
  color: "#f5f0eb",
  textDecoration: "none",
} as const;

export default function RoutePanel({ pickup, ngo, routeInfo, onGetRoute }: RoutePanelProps) {
  if (!ngo) {
    return (
      <div style={{ padding: 18, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, background: "rgba(255,255,255,0.03)" }}>
        <p style={{ color: "#a89b85", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>Select an NGO to preview route, ETA, and navigation.</p>
      </div>
    );
  }

  const destination = ngo.lat && ngo.lng ? { lat: ngo.lat, lng: ngo.lng } : null;
  const canRoute = Boolean(pickup && destination);

  return (
    <div style={{ padding: 18, border: "1px solid rgba(255,87,34,0.24)", borderRadius: 12, background: "rgba(255,87,34,0.06)" }}>
      <h3 style={{ fontFamily: "'Playfair Display', serif", color: "#f5f0eb", margin: "0 0 6px", fontSize: "1.2rem" }}>{ngo.name}</h3>
      <p style={{ color: "#a89b85", fontFamily: "'DM Sans', sans-serif", fontSize: "0.84rem", margin: "0 0 14px" }}>
        {ngo.address || `${ngo.area}, ${ngo.city}`}
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, color: "#f5f0eb", fontFamily: "'DM Sans', sans-serif", fontSize: "0.86rem", marginBottom: 14 }}>
        <span>{routeInfo?.distanceText || (ngo.distanceKm ? `${ngo.distanceKm.toFixed(1)} km` : "Distance pending")}</span>
        <span style={{ color: "#a89b85" }}>·</span>
        <span>{routeInfo?.durationText || ngo.estimatedTravelTime || "ETA after route"}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button style={{ ...action, opacity: canRoute ? 1 : 0.6 }} disabled={!canRoute} onClick={onGetRoute}>
          Get Route
        </button>
        <a
          style={{ ...ghost, pointerEvents: canRoute ? "auto" : "none", opacity: canRoute ? 1 : 0.6 }}
          href={googleMapsRouteUrl(pickup, destination)}
          target="_blank"
          rel="noreferrer"
        >
          Open in Google Maps
        </a>
      </div>
    </div>
  );
}
