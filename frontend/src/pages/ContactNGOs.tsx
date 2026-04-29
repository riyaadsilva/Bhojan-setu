import { useEffect, useMemo, useState } from "react";
import AppNav from "../components/AppNav";
import NGOMapView from "../components/NGOMapView";
import RoutePanel from "../components/RoutePanel";
import { useUser } from "../contexts/UserContext";
import { NGOS, NGO } from "../data/ngos";
import { createContactRequest, fetchNearbyNGOs, aiRecommendNGOs } from "../services/api";
import { estimateEta, haversineKm, RouteInfo } from "../services/maps";

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
  const { donations, profile, contactedNgos, addContactedNgo } = useUser();
  const latestDonation = donations.find((donation) => Number.isFinite(donation.pickupLat) && Number.isFinite(donation.pickupLng)) || donations[0];
  const pickup = Number.isFinite(latestDonation?.pickupLat) && Number.isFinite(latestDonation?.pickupLng)
    ? { lat: latestDonation!.pickupLat as number, lng: latestDonation!.pickupLng as number }
    : null;

  const [search, setSearch] = useState("");
  const [radius, setRadius] = useState("10");
  const [sort, setSort] = useState<"nearest" | "rating">("nearest");
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
  const [aiRankedNgos, setAiRankedNgos] = useState<NGO[]>([]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setApiError("");

    const activePickup = userLocation || pickup;

    fetchNearbyNGOs({
      lat: activePickup?.lat,
      lng: activePickup?.lng,
      radiusKm: radius === "all" ? undefined : Number(radius),
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
  }, [pickup?.lat, pickup?.lng, userLocation?.lat, userLocation?.lng, radius, sort, search]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const maxRadius = radius === "all" ? undefined : Number(radius);
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
        const isContacted = contactedNgos.includes(ngo.id || ngo._id || ngo.name);
        const matchesRadius = maxRadius === undefined || ngo.distanceKm <= maxRadius || isContacted;
        return matchesSearch && matchesRadius;
      })
      .sort((a, b) => {
        const isAContacted = contactedNgos.includes(a.id || a._id || a.name);
        const isBContacted = contactedNgos.includes(b.id || b._id || b.name);
        
        // Push contacted NGOs slightly higher if sorting by nearest, but respect distance mainly
        // Or we can just leave the sort as is, since the user didn't ask to prioritize them in the list
        return sort === "rating" ? b.rating - a.rating || a.distanceKm - b.distanceKm : a.distanceKm - b.distanceKm;
      });
  }, [ngos, search, pickup?.lat, pickup?.lng, userLocation?.lat, userLocation?.lng, radius, sort, contactedNgos]);

  const activeNgo = selected || filtered[0] || null;

  useEffect(() => {
    if (selected && !filtered.some((ngo) => (ngo.id || ngo._id || ngo.name) === (selected.id || selected._id || selected.name))) {
      setSelected(null);
      setRouteTarget(null);
      setRouteInfo(null);
    }
  }, [filtered, selected]);

  // ── AI NGO Ranking (non-blocking, updates when filtered list settles) ────────
  useEffect(() => {
    if (filtered.length === 0) return;
    const donation = latestDonation
      ? { category: latestDonation.category, remaining: latestDonation.remaining }
      : { category: "normal", remaining: "" };
    aiRecommendNGOs(donation as Record<string, unknown>, filtered)
      .then((ranked) => setAiRankedNgos((ranked as NGO[]).slice(0, 3)))
      .catch(() => { /* silently skip if backend unavailable */ });
  }, [filtered.length]);

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
      addContactedNgo(ngoId);
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

        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(360px, 0.9fr)", gap: 22, alignItems: "stretch", marginTop: 20 }}>
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 150px", gap: 10, marginBottom: 10 }}>
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
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10, marginBottom: 14 }}>
              <select value={radius} onChange={(e) => setRadius(e.target.value)} style={control}>
                <option value="2">Within 2 km</option>
                <option value="5">Within 5 km</option>
                <option value="10">Within 10 km</option>
                <option value="all">Any distance</option>
              </select>
            </div>

            {isLoading && <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>Loading nearby NGOs...</p>}
            {apiError && <p style={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>{apiError}</p>}
            {!(userLocation || pickup) && <p style={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>No pickup coordinates found yet. Click 'Locate Me' or add a pinned donation location for live distance and route accuracy.</p>}

            {/* ── AI Recommended NGOs ────────────────────────────────────── */}
            {aiRankedNgos.length > 0 && (
              <div style={{ marginBottom: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", fontWeight: 600 }}>
                    Recommended NGOs
                  </span>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {aiRankedNgos.map((ngo, i) => (
                    <div
                      key={`ai-${ngo.id || ngo._id || ngo.name}`}
                      onClick={() => handleSelectNgo(ngo)}
                      style={{
                        ...card,
                        border: "1px solid rgba(255,87,34,0.3)",
                        background: "rgba(255,87,34,0.05)",
                        cursor: "pointer",
                        padding: "1.2rem 1.5rem",
                        transition: "border-color 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                            <span style={{
                              fontFamily: "'Playfair Display', serif",
                              color: "rgba(255,255,255,0.95)",
                              fontSize: "1.05rem",
                              fontWeight: 600,
                            }}>
                              {ngo.name}
                            </span>
                            <span style={{ fontSize: "0.72rem", background: "rgba(255,87,34,0.18)", color: "#FF5722", padding: "2px 8px", borderRadius: 99, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap" }}>
                              {i === 0 ? "Best Pick" : `#${i + 1} Pick`}
                            </span>
                          </div>
                          <p style={{ color: "rgba(255,255,255,0.6)", fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", margin: 0, lineHeight: 1.5 }}>
                            {ngo.address || `${ngo.area}, ${ngo.city}`}
                          </p>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.15rem", fontWeight: 700, color: "#FF5722" }}>
                            {ngo.distanceKm?.toFixed(1)} km
                          </div>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                            {ngo.estimatedTravelTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginTop: 18, marginBottom: 4 }} />
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>All NGOs below</span>
              </div>
            )}

            <div style={{ display: "grid", gap: 14, maxHeight: 760, overflowY: "auto", paddingRight: 4 }}>
              {!filtered.length && !isLoading && (
                <div style={{ ...card, color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>
                  No NGOs match the current filters. Try increasing the radius or searching a different area.
                </div>
              )}
              {filtered.map((ngo) => {
                const isActive = activeNgo?.id === ngo.id || activeNgo?._id === ngo._id;
                return (
                  <div key={ngo.id || ngo._id || ngo.name} style={{ ...card, borderColor: isActive ? "rgba(255,87,34,0.55)" : "rgba(255,255,255,0.08)" }}>
                    <div style={{ display: "flex", gap: 14 }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ fontFamily: "'Playfair Display', serif", color: "rgba(255, 255, 255, 0.95)", fontSize: "1.25rem", margin: "0 0 5px", fontWeight: 600, lineHeight: 1.4 }}>
                          {ngo.name}
                          {contactedNgos.includes(ngo.id || ngo._id || ngo.name) && (
                            <span style={{ fontSize: "0.75rem", background: "rgba(74, 222, 128, 0.15)", color: "#4ade80", padding: "2px 8px", borderRadius: 12, marginLeft: 10, verticalAlign: "middle", fontWeight: 500 }}>
                              Contacted
                            </span>
                          )}
                        </h3>
                        <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65, margin: "0 0 8px" }}>
                          {ngo.address || `${ngo.area}, ${ngo.city}`} · {ngo.phone}
                        </p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255, 255, 255, 0.95)" }}>
                          <span>{ngo.distanceKm.toFixed(1)} km</span>
                          <span style={{ color: "rgba(255, 255, 255, 0.72)" }}>·</span>
                          <span>{ngo.estimatedTravelTime}</span>
                        </div>
                      </div>
                    </div>
                    <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65, margin: "1rem 0" }}>{ngo.description}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      <button style={btn} onClick={() => handleSelectNgo(ngo)}>View on Map</button>
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
            <div style={{ padding: "2rem" }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "rgba(255, 255, 255, 0.95)", fontSize: "1.8rem", margin: "0 0 6px", fontWeight: 700, lineHeight: 1.2 }}>
                {modalNgo.name}
                {contactedNgos.includes(modalNgo.id || modalNgo._id || modalNgo.name) && (
                  <span style={{ fontSize: "0.85rem", background: "rgba(74, 222, 128, 0.15)", color: "#4ade80", padding: "4px 10px", borderRadius: 14, marginLeft: 12, verticalAlign: "middle", fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>
                    Previously Contacted
                  </span>
                )}
              </h2>
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
