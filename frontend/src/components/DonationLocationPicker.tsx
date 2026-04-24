import { useEffect, useRef, useState } from "react";
import { defaultPickupCenter, darkMapStyles, LatLng, loadGoogleMaps } from "../services/maps";

export interface PickupLocation extends Partial<LatLng> {
  address?: string;
}

interface DonationLocationPickerProps {
  value: PickupLocation;
  onChange: (location: PickupLocation) => void;
}

const label = { fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "#a89b85", marginBottom: 6, display: "block" };
const input = {
  width: "100%",
  background: "#0f0d0a",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "#f5f0eb",
  padding: "12px 14px",
  borderRadius: 10,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.9rem",
  outline: "none",
} as const;

export default function DonationLocationPicker({ value, onChange }: DonationLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const map = useRef<any>(null);
  const previewMap = useRef<any>(null);
  const marker = useRef<any>(null);
  const previewMarker = useRef<any>(null);
  const geocoder = useRef<any>(null);
  const applyLocationRef = useRef<((position: LatLng, address?: string, zoom?: number) => void) | null>(null);
  const [mapError, setMapError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const selected = Number.isFinite(value.lat) && Number.isFinite(value.lng) ? { lat: value.lat as number, lng: value.lng as number } : null;

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((google) => {
        if (cancelled || !mapRef.current || !previewRef.current) return;
        setIsLoading(false);
        geocoder.current = new google.maps.Geocoder();

        const center = selected || defaultPickupCenter;
        map.current = new google.maps.Map(mapRef.current, {
          center,
          zoom: selected ? 15 : 12,
          styles: darkMapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        });

        previewMap.current = new google.maps.Map(previewRef.current, {
          center,
          zoom: selected ? 15 : 11,
          styles: darkMapStyles,
          disableDefaultUI: true,
          gestureHandling: "none",
        });

        marker.current = new google.maps.Marker({
          map: map.current,
          position: center,
          draggable: true,
          visible: Boolean(selected),
          title: "Pickup location",
        });
        previewMarker.current = new google.maps.Marker({
          map: previewMap.current,
          position: center,
          visible: Boolean(selected),
          title: "Pickup preview",
        });

        const applyLocation = (position: LatLng, address?: string, zoom = 15) => {
          marker.current.setPosition(position);
          marker.current.setVisible(true);
          previewMarker.current.setPosition(position);
          previewMarker.current.setVisible(true);
          map.current.panTo(position);
          previewMap.current.panTo(position);
          map.current.setZoom(zoom);
          previewMap.current.setZoom(Math.max(11, zoom - 1));

          if (address) {
            onChange({ ...position, address });
            return;
          }

          geocoder.current.geocode({ location: position }, (results: any[], status: string) => {
            onChange({
              ...position,
              address: status === "OK" && results?.[0]?.formatted_address ? results[0].formatted_address : `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`,
            });
          });
        };
        applyLocationRef.current = applyLocation;

        map.current.addListener("click", (event: any) => {
          applyLocation({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        });

        marker.current.addListener("dragend", (event: any) => {
          applyLocation({ lat: event.latLng.lat(), lng: event.latLng.lng() });
        });

        if (searchRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(searchRef.current, {
            fields: ["formatted_address", "geometry", "name"],
            componentRestrictions: { country: "in" },
          });

          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            const location = place.geometry?.location;
            if (!location) {
              setMapError("Select an address from the suggestions or drop a pin on the map.");
              return;
            }
            setMapError("");
            applyLocation({ lat: location.lat(), lng: location.lng() }, place.formatted_address || place.name, 16);
          });
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setIsLoading(false);
          setMapError(error.message || "Google Maps is unavailable. You can still enter the address manually.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!marker.current || !previewMarker.current) return;
    if (!selected) {
      marker.current.setVisible(false);
      previewMarker.current.setVisible(false);
      return;
    }
    marker.current.setPosition(selected);
    marker.current.setVisible(true);
    previewMarker.current.setPosition(selected);
    previewMarker.current.setVisible(true);
    map.current?.panTo(selected);
    previewMap.current?.panTo(selected);
  }, [value.lat, value.lng]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setMapError("Unable to fetch current location. Please search manually.");
      return;
    }

    setIsFetchingLocation(true);
    setMapError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsFetchingLocation(false);
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        applyLocationRef.current?.(nextLocation, undefined, 16);
      },
      () => {
        setIsFetchingLocation(false);
        setMapError("Unable to fetch current location. Please search manually.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <div style={{ marginBottom: 20 }}>
      <label style={label}>Pickup Location</label>
      <button
        type="button"
        onClick={handleUseCurrentLocation}
        disabled={isLoading || isFetchingLocation}
        style={{
          width: "100%",
          marginBottom: 12,
          background: "rgba(255,87,34,0.12)",
          border: "1px solid rgba(255,87,34,0.34)",
          color: "#f5f0eb",
          padding: "12px 14px",
          borderRadius: 10,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.9rem",
          cursor: isLoading || isFetchingLocation ? "progress" : "pointer",
        }}
      >
        {isFetchingLocation ? "Fetching Current Location..." : "Use My Current Location"}
      </button>
      <input
        ref={searchRef}
        style={input}
        value={value.address || ""}
        onChange={(e) => onChange({ ...value, address: e.target.value })}
        placeholder="Search address, building, landmark..."
      />

      <div
        style={{
          position: "relative",
          height: 280,
          borderRadius: 12,
          overflow: "hidden",
          marginTop: 12,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "#17130f",
        }}
      >
        <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
        {isLoading && (
          <div style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#a89b85",
            fontFamily: "'DM Sans', sans-serif",
            background: "rgba(23,19,15,0.72)",
          }}>
            Loading pickup map...
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <div>
          <label style={label}>Latitude</label>
          <input
            style={input}
            value={value.lat ?? ""}
            onChange={(e) => onChange({ ...value, lat: e.target.value === "" ? undefined : Number(e.target.value) })}
            placeholder="Auto-filled"
          />
        </div>
        <div>
          <label style={label}>Longitude</label>
          <input
            style={input}
            value={value.lng ?? ""}
            onChange={(e) => onChange({ ...value, lng: e.target.value === "" ? undefined : Number(e.target.value) })}
            placeholder="Auto-filled"
          />
        </div>
      </div>

      {mapError && <p style={{ color: "#ffb86b", fontFamily: "'DM Sans', sans-serif", fontSize: "0.82rem", margin: "10px 0 0" }}>{mapError}</p>}

      <div style={{ marginTop: 14 }}>
        <label style={label}>Pickup Preview</label>
        <div
          style={{
            position: "relative",
            height: 120,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(255,87,34,0.32)",
            background: "#17130f",
          }}
        >
          <div ref={previewRef} style={{ height: "100%", width: "100%" }} />
          {!selected && !isLoading && (
            <div style={{
              position: "absolute",
              inset: 0,
              display: "grid",
              placeItems: "center",
              padding: 16,
              color: "#a89b85",
              fontFamily: "'DM Sans', sans-serif",
              background: "rgba(23,19,15,0.6)",
              textAlign: "center",
            }}>
              Drop a pin to preview pickup location.
            </div>
          )}
        </div>
        {selected && (
          <p style={{ color: "#a89b85", fontFamily: "'DM Sans', sans-serif", fontSize: "0.8rem", margin: "8px 0 0" }}>
            {value.address || "Pinned location"} · {selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}
