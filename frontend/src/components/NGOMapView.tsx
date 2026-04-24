import { useEffect, useRef, useState } from "react";
import type { NGO } from "../data/ngos";
import { darkMapStyles, defaultPickupCenter, LatLng, loadGoogleMaps, RouteInfo } from "../services/maps";

interface NGOMapViewProps {
  pickup?: LatLng | null;
  ngos: NGO[];
  selectedNgoId?: string | null;
  routeTarget?: NGO | null;
  onSelectNgo: (ngo: NGO) => void;
  onRouteCalculated: (info: RouteInfo | null) => void;
}

export default function NGOMapView({ pickup, ngos, selectedNgoId, routeTarget, onSelectNgo, onRouteCalculated }: NGOMapViewProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const map = useRef<any>(null);
  const pickupMarker = useRef<any>(null);
  const ngoMarkers = useRef<Map<string, any>>(new Map());
  const directionsRenderer = useRef<any>(null);
  const directionsService = useRef<any>(null);
  const [error, setError] = useState("");
  const [mapReady, setMapReady] = useState(false);
  const center = pickup || defaultPickupCenter;

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current) return;
        map.current = new google.maps.Map(mapRef.current, {
          center,
          zoom: pickup ? 12 : 10,
          styles: darkMapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
        });

        directionsService.current = new google.maps.DirectionsService();
        directionsRenderer.current = new google.maps.DirectionsRenderer({
          map: map.current,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#FF5722",
            strokeOpacity: 0.95,
            strokeWeight: 5,
          },
        });
        setMapReady(true);
      })
      .catch((err) => setError(err.message || "Map unavailable."));

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!map.current || !window.google?.maps) return;
    const google = window.google;

    if (!pickupMarker.current) {
      pickupMarker.current = new google.maps.Marker({
        map: map.current,
        title: "Donor pickup",
        label: { text: "D", color: "#fff", fontWeight: "700" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: "#FF5722",
          fillOpacity: 1,
          strokeColor: "#fff",
          strokeWeight: 2,
        },
      });
    }

    pickupMarker.current.setPosition(pickup || defaultPickupCenter);
    pickupMarker.current.setVisible(Boolean(pickup));

    ngoMarkers.current.forEach((marker) => marker.setMap(null));
    ngoMarkers.current.clear();

    const bounds = new google.maps.LatLngBounds();
    if (pickup) bounds.extend(pickup);

    ngos.forEach((ngo) => {
      if (!ngo.lat || !ngo.lng) return;
      const isSelected = selectedNgoId === ngo.id || selectedNgoId === ngo._id;
      const position = { lat: ngo.lat, lng: ngo.lng };
      const marker = new google.maps.Marker({
        position,
        map: map.current,
        title: ngo.name,
        label: { text: "N", color: "#17130f", fontWeight: "800" },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 11 : 8,
          fillColor: isSelected ? "#ffd0bd" : "#f5f0eb",
          fillOpacity: 1,
          strokeColor: "#FF5722",
          strokeWeight: isSelected ? 4 : 2,
        },
      });
      marker.addListener("click", () => onSelectNgo(ngo));
      ngoMarkers.current.set(ngo.id || ngo._id || ngo.name, marker);
      bounds.extend(position);
    });

    if (!bounds.isEmpty()) map.current.fitBounds(bounds, 60);
  }, [ngos, pickup?.lat, pickup?.lng]);

  useEffect(() => {
    if (!map.current || !window.google?.maps) return;
    const google = window.google;
    ngoMarkers.current.forEach((marker, id) => {
      const isSelected = selectedNgoId === id;
      marker.setIcon({
        path: google.maps.SymbolPath.CIRCLE,
        scale: isSelected ? 11 : 8,
        fillColor: isSelected ? "#ffd0bd" : "#f5f0eb",
        fillOpacity: 1,
        strokeColor: "#FF5722",
        strokeWeight: isSelected ? 4 : 2,
      });
      if (isSelected) map.current.panTo(marker.getPosition());
    });
  }, [selectedNgoId]);

  useEffect(() => {
    if (!pickup || !routeTarget?.lat || !routeTarget.lng || !directionsService.current || !directionsRenderer.current || !window.google?.maps) {
      directionsRenderer.current?.setDirections({ routes: [] });
      onRouteCalculated(null);
      return;
    }

    directionsService.current.route(
      {
        origin: pickup,
        destination: { lat: routeTarget.lat, lng: routeTarget.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result: any, status: string) => {
        if (status !== "OK" || !result?.routes?.[0]?.legs?.[0]) {
          onRouteCalculated(null);
          return;
        }
        directionsRenderer.current.setDirections(result);
        const leg = result.routes[0].legs[0];
        onRouteCalculated({
          distanceText: leg.distance?.text || "Distance unavailable",
          durationText: leg.duration?.text || "ETA unavailable",
        });
      }
    );
  }, [mapReady, pickup?.lat, pickup?.lng, routeTarget?.id, routeTarget?._id]);

  return (
    <div
      style={{
        minHeight: 420,
        height: "100%",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.1)",
        background: "#17130f",
        position: "relative",
      }}
    >
      <div ref={mapRef} style={{ height: "100%", minHeight: 420 }} />
      {error && (
        <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", padding: 24, color: "#a89b85", fontFamily: "'DM Sans', sans-serif", textAlign: "center" }}>
          {error} NGO distances will use the saved coordinates until Maps is configured.
        </div>
      )}
    </div>
  );
}
