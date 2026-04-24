import { debugError, debugLog } from "./debug";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface RouteInfo {
  distanceText: string;
  durationText: string;
}

const GOOGLE_SCRIPT_ID = "bhojansetu-google-maps";

export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

export const defaultPickupCenter: LatLng = { lat: 19.076, lng: 72.8777 };

export const darkMapStyles = [
  { elementType: "geometry", stylers: [{ color: "#17130f" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#d7c8b5" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#17130f" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#5f4738" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#211b15" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#a89b85" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2b231c" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#11100d" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#b9aa98" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#241d17" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0a1117" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#687884" }] },
];

declare global {
  interface Window {
    google?: any;
    __bhojanSetuGoogleMapsPromise?: Promise<any>;
    __bhojanSetuGoogleMapsReady?: () => void;
  }
}

export function loadGoogleMaps(apiKey = GOOGLE_MAPS_API_KEY) {
  if (window.google?.maps) {
    debugLog("maps:already_loaded");
    return Promise.resolve(window.google);
  }
  if (!apiKey) {
    debugError("maps:missing_api_key");
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY."));
  }
  if (window.__bhojanSetuGoogleMapsPromise) return window.__bhojanSetuGoogleMapsPromise;

  window.__bhojanSetuGoogleMapsPromise = new Promise((resolve, reject) => {
    debugLog("maps:loading_script");
    window.__bhojanSetuGoogleMapsReady = () => {
      debugLog("maps:loaded");
      resolve(window.google);
    };

    const existingScript = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("error", () => {
        debugError("maps:script_error_existing");
        reject(new Error("Google Maps failed to load."));
      }, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = GOOGLE_SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places&callback=__bhojanSetuGoogleMapsReady`;
    script.onerror = () => {
      debugError("maps:script_error");
      reject(new Error("Google Maps failed to load."));
    };
    document.head.appendChild(script);
  });

  return window.__bhojanSetuGoogleMapsPromise;
}

export function haversineKm(a?: LatLng | null, b?: LatLng | null) {
  if (!a || !b || !Number.isFinite(a.lat) || !Number.isFinite(a.lng) || !Number.isFinite(b.lat) || !Number.isFinite(b.lng)) {
    return undefined;
  }

  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function estimateEta(distanceKm?: number) {
  if (distanceKm === undefined) return "Route unavailable";
  const minutes = Math.max(4, Math.round((distanceKm / 18) * 60));
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

export function googleMapsRouteUrl(origin?: LatLng | null, destination?: LatLng | null) {
  if (!origin || !destination) return "#";
  return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`;
}

export function parseQuantityKg(value?: string) {
  if (!value) return undefined;
  const match = value.match(/(\d+(?:\.\d+)?)/);
  if (!match) return undefined;
  return Number(match[1]);
}
