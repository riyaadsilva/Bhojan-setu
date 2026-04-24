import { useEffect, useMemo, useState } from "react";
import AppNav from "../components/AppNav";
import NGOMapView from "../components/NGOMapView";
import RoutePanel from "../components/RoutePanel";
import { useUser } from "../contexts/UserContext";
import { NGOS, NGO } from "../data/ngos";
import { createContactRequest, fetchNearbyNGOs } from "../services/api";
import { estimateEta, haversineKm, parseQuantityKg, RouteInfo } from "../services/maps";

const card = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  padding: "2rem",
};
const btn = {
  background: "#FF5722",
  color: "#fff",
  border: "none",
  padding: "1rem 2rem",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 700,
  fontSize: "1rem",
};
const btnGhost = {
  background: "transparent",
  color: "rgba(255, 255, 255, 0.95)",
  border: "1px solid rgba(255,255,255,0.18)",
  padding: "1rem 2rem",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "1rem",
};
const control = {
  background: "#0f0d0a",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255, 255, 255, 0.95)",
  padding: "1rem",
  borderRadius: 10,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "1rem",
  outline: "none",
} as const;

export default function ContactNGOs() {
  const { donations, profile } = useUser();
  const latestDonation = donations.find((donation) => Number.isFinite(donation.pickupLat) && Number.isFinite(donation.pickupLng)) || donations[0];
  const pickup = Number.isFinite(latestDonation?.pickupLat) && Number.isFinite(latestDonation?.pickupLng)
    ? { lat: latestDonation!.pickupLat as number, lng: latestDonation!.pickupLng as number }
    : null;
  const quantityKg = parseQuantityKg(latestDonation?.remaining);

  const [search, setSearch] = useState("");
  const [radius, setRadius] = useState("10");
  const [sort, setSort] = useState<"nearest" | "rating">("nearest");
  const [category, setCategory] = useState<"all" | "healthy" | "normal" | "junk">("all");
  const [quantity, setQuantity] = useState(quantityKg ? String(quantityKg) : "");
  const [ngos, setNgos] = useState<NGO[]>(NGOS);
  const [selected, setSelected] = useState<NGO | null>(null);
  const [modalNgo, setModalNgo] = useState<NGO | null>(null);
  const [routeTarget, setRouteTarget] = useState<NGO | null>(null);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [requestSent, setRequestSent] = useState<string | null>(null);
  const [requestError, setRequestError] = useState("");
  const [isSendingRequest, setIsSendingRequest] = useState(false);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    setQuantity(quantityKg ? String(quantityKg) : "");
  }, [quantityKg]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setApiError("");

    const activePickup = userLocation || pickup;

    fetchNearbyNGOs({
      lat: activePickup?.lat,
      lng: activePickup?.lng,
      radiusKm: radius === "all" ? undefined : Number(radius),
      category: category === "all" ? undefined : category,
      quantityKg: quantity ? Number(quantity) : undefined,
      sort,
      search,
    })
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setNgos(data.map((ngo) => ({ ...ngo, id: ngo.id || ngo._id || ngo.name })));
      })
      .catch(() => {
        if (!cancelled) setApiError("Using sample NGO data. Start the backend to enable live proximity search.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [pickup?.lat, pickup?.lng, userLocation?.lat, userLocation?.lng, radius, category, quantity, sort, search]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const maxRadius = radius === "all" ? undefined : Number(radius);
    const amount = quantity ? Number(quantity) : undefined;
    const activePickup = userLocation || pickup;

    return ngos
      .map((ngo) => {
        const distance = haversineKm(activePickup, ngo.lat && ngo.lng ? { lat: ngo.lat, lng: ngo.lng } : null) ?? ngo.distanceKm;
        return {
          ...ngo,
          distanceKm: Number(distance.toFixed(1)),
          estimatedTravelTime: estimateEta(distance),
        };
      })
      .filter((ngo) => {
        const matchesSearch = !q || ngo.name.toLowerCase().includes(q) || ngo.area.toLowerCase().includes(q) || ngo.city.toLowerCase().includes(q);
        const matchesRadius = maxRadius === undefined || ngo.distanceKm <= maxRadius;
        const matchesCategory = category === "all" || !ngo.acceptedCategories || ngo.acceptedCategories.includes(category);
        const matchesQuantity = !amount || !ngo.maxPickupQuantityKg || ngo.maxPickupQuantityKg >= amount;
        return matchesSearch && matchesRadius && matchesCategory && matchesQuantity;
      })
      .sort((a, b) => (sort === "rating" ? b.rating - a.rating || a.distanceKm - b.distanceKm : a.distanceKm - b.distanceKm));
  }, [ngos, search, pickup?.lat, pickup?.lng, userLocation?.lat, userLocation?.lng, radius, category, quantity, sort]);

  const activeNgo = selected || filtered[0] || null;

  useEffect(() => {
    if (selected && !filtered.some((ngo) => (ngo.id || ngo._id || ngo.name) === (selected.id || selected._id || selected.name))) {
      setSelected(null);
      setRouteTarget(null);
      setRouteInfo(null);
    }
  }, [filtered, selected]);

  const sendRequest = async () => {
    if (!modalNgo) return;
    const ngoId = modalNgo._id || modalNgo.id;
    if (!ngoId) {
      setRequestError("This NGO needs a backend ID before a contact request can be saved.");
      return;
    }

    setIsSendingRequest(true);
    setRequestError("");
    try {
      await createContactRequest({
        ngo: ngoId,
        donorName: latestDonation?.donorName || profile.name || profile.businessName || "Food donor",
        donorPhone: latestDonation?.donorPhone || profile.phone,
        donorEmail: profile.email,
        donorLocation: latestDonation?.pickupAddress || latestDonation?.donorLocation || profile.location || profile.address,
        message: message.trim() || "We have surplus food ready for pickup. Please contact us to coordinate.",
      });
      setRequestSent(ngoId);
      setTimeout(() => {
        setRequestSent(null);
        setModalNgo(null);
        setMessage("");
      }, 2200);
    } catch (error: any) {
      setRequestError(error.message || "Could not send the contact request. Please try again.");
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleSelectNgo = (ngo: NGO) => {
    setSelected(ngo);
    setRouteInfo(null);
  };

  const handleUseMyLocation = () => {
    if ("geolocation" in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
          setIsLoading(false);
        },
        () => {
          setApiError("Geolocation access denied or failed.");
          setIsLoading(false);
        }
      );
    } else {
      setApiError("Geolocation is not supported by your browser.");
    }
  };

  return (
    <div className="bs-root">
      <AppNav active="Contact NGOs" />

      <div style={{ paddingTop: 110, padding: "110px 2rem 6rem", maxWidth: 1280, margin: "0 auto" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.18em", color: "rgba(255, 255, 255, 0.9)", textTransform: "uppercase", fontWeight: 600 }}>
          Partner Network
        </span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.4rem, 4vw, 4rem)", color: "rgba(255, 255, 255, 0.95)", margin: "1rem 0 0.5rem", fontWeight: 700, lineHeight: 1.2 }}>
          NGOs Available For Pickup
        </h1>
        <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", marginBottom: 20, fontSize: "1rem", lineHeight: 1.65 }}>
          {filtered.length} verified NGOs sorted by pickup proximity from {latestDonation?.pickupAddress || latestDonation?.donorLocation || "your selected donation"}.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(360px, 0.9fr)", gap: 22, alignItems: "stretch" }}>
          <div style={{ display: "grid", gap: 16 }}>
            <NGOMapView
              pickup={userLocation || pickup}
              ngos={filtered}
              selectedNgoId={activeNgo?.id || activeNgo?._id}
              routeTarget={routeTarget}
              onSelectNgo={handleSelectNgo}
              onRouteCalculated={setRouteInfo}
            />
            <RoutePanel pickup={userLocation || pickup} ngo={activeNgo} routeInfo={routeInfo} onGetRoute={() => setRouteTarget(activeNgo)} />
          </div>

          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px 150px", gap: 10, marginBottom: 10 }}>
              <input
                type="text"
                placeholder="Search by NGO, area, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={control}
              />
              <button style={btnGhost} onClick={handleUseMyLocation} title="Use My Location">
                📍 Locate Me
              </button>
              <select value={sort} onChange={(e) => setSort(e.target.value as "nearest" | "rating")} style={control}>
                <option value="nearest">Nearest first</option>
                <option value="rating">Top rated</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 14 }}>
              <select value={radius} onChange={(e) => setRadius(e.target.value)} style={control}>
                <option value="2">Within 2 km</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="all">Any distance</option>
              </select>
              <select value={category} onChange={(e) => setCategory(e.target.value as any)} style={control}>
                <option value="all">All food</option>
                <option value="healthy">Healthy</option>
                <option value="normal">Normal</option>
                <option value="junk">Junk</option>
              </select>
              <input type="number" min="0" placeholder="Kg" value={quantity} onChange={(e) => setQuantity(e.target.value)} style={control} />
            </div>

            {isLoading && <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>Loading nearby NGOs...</p>}
            {apiError && <p style={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>{apiError}</p>}
            {!(userLocation || pickup) && <p style={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>No pickup coordinates found yet. Click 'Locate Me' or add a pinned donation location for live distance and route accuracy.</p>}

            <div style={{ display: "grid", gap: 14, maxHeight: 760, overflowY: "auto", paddingRight: 4 }}>
              {!filtered.length && !isLoading && (
                <div style={{ ...card, color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>
                  No NGOs match the current filters. Try increasing the radius or clearing category and quantity filters.
                </div>
              )}
              {filtered.map((ngo) => {
                const isActive = activeNgo?.id === ngo.id || activeNgo?._id === ngo._id;
                return (
                  <div key={ngo.id || ngo._id || ngo.name} style={{ ...card, borderColor: isActive ? "rgba(255,87,34,0.55)" : "rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", gap: 14 }}>
                      <img src={ngo.image} alt={ngo.name} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 10, flex: "0 0 auto" }} />
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", color: "rgba(255, 255, 255, 0.95)", fontSize: "1.25rem", margin: "0 0 5px", fontWeight: 600, lineHeight: 1.4 }}>{ngo.name}</h3>
                        <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65, margin: "0 0 8px" }}>
                          {ngo.address || `${ngo.area}, ${ngo.city}`} · {ngo.phone}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255, 255, 255, 0.95)" }}>
                          <span>{ngo.distanceKm.toFixed(1)} km</span>
                          <span style={{ color: "rgba(255, 255, 255, 0.72)" }}>·</span>
                          <span>{ngo.estimatedTravelTime}</span>
                          <span style={{ color: "rgba(255, 255, 255, 0.72)" }}>·</span>
                          <span>{ngo.rating} rating</span>
                        </div>
                      </div>
                    </div>
                    <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65, margin: "1rem 0" }}>{ngo.description}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <button style={btn} onClick={() => handleSelectNgo(ngo)}>View on Map</button>
                      <button style={btnGhost} onClick={() => { handleSelectNgo(ngo); setRouteTarget(ngo); }}>Get Route</button>
                      <button style={btnGhost} onClick={() => { setSelected(ngo); setModalNgo(ngo); }}>Contact</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {modalNgo && (
        <div onClick={() => setModalNgo(null)} style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.78)", zIndex: 200,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#1a1714", borderRadius: 18, maxWidth: 600, width: "100%",
            border: "1px solid rgba(255,255,255,0.1)", overflow: "hidden",
          }}>
            <img src={modalNgo.image} alt={modalNgo.name} style={{ width: "100%", height: 190, objectFit: "cover" }} />
            <div style={{ padding: "2rem" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "rgba(255, 255, 255, 0.95)", fontSize: "1.8rem", margin: "0 0 6px", fontWeight: 700, lineHeight: 1.2 }}>{modalNgo.name}</h2>
              <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", margin: "0 0 18px", lineHeight: 1.65 }}>{modalNgo.cause}</p>

              <div style={{ display: "grid", gap: 10, fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255, 255, 255, 0.95)", marginBottom: 18 }}>
                <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Address:</strong> {modalNgo.address || `${modalNgo.area}, ${modalNgo.city}`}</div>
                <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Phone:</strong> {modalNgo.phone}</div>
                <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Email:</strong> {modalNgo.email}</div>
                <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Distance:</strong> {modalNgo.distanceKm.toFixed(1)} km · {modalNgo.estimatedTravelTime}</div>
                <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Meals served:</strong> {modalNgo.mealsServed.toLocaleString()}+</div>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add pickup notes, food details, packaging, or timing..."
                style={{
                  width: "100%", minHeight: 90, background: "#0f0d0a",
                  border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255, 255, 255, 0.95)",
                  padding: "1rem", borderRadius: 10, fontFamily: "'DM Sans', sans-serif",
                  fontSize: "1rem", resize: "vertical", outline: "none", marginBottom: 14,
                }}
              />

              {requestError && <p style={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", margin: "0 0 12px", lineHeight: 1.65 }}>{requestError}</p>}
              {requestSent === (modalNgo._id || modalNgo.id) ? (
                <p style={{ color: "#4ade80", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>
                  Contact request sent. {modalNgo.name} will reach out shortly.
                </p>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                  <button style={{ ...btn, opacity: isSendingRequest ? 0.7 : 1 }} onClick={sendRequest} disabled={isSendingRequest}>{isSendingRequest ? "Sending..." : "Send Contact Request"}</button>
                  <button style={btnGhost} onClick={() => { setSelected(modalNgo); setRouteTarget(modalNgo); setModalNgo(null); }}>Get Route</button>
                  <button style={btnGhost} onClick={() => setModalNgo(null)}>Close</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
