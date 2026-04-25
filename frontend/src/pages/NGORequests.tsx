import { useEffect, useMemo, useState } from "react";
import AppNav from "../components/AppNav";
import { useUser, type FoodDonation } from "../contexts/UserContext";
import {
  acceptDonationRequestApi,
  completeDonationApi,
  denyDonationRequestApi,
  fetchDonations,
  setDonationFulfillmentApi,
} from "../services/api";

const card = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  padding: "2rem",
  cursor: "pointer",
  transition: "transform 0.2s, border-color 0.2s",
};

const actionBtn = (bg: string, disabled = false) => ({
  background: bg,
  color: "#fff",
  border: "none",
  padding: "1rem 2rem",
  borderRadius: 8,
  cursor: disabled ? "not-allowed" : "pointer",
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 600,
  fontSize: "1rem",
  opacity: disabled ? 0.55 : 1,
});

const ghostBtn = {
  background: "transparent",
  color: "rgba(255, 255, 255, 0.95)",
  border: "1px solid rgba(255,255,255,0.18)",
  padding: "1rem 2rem",
  borderRadius: 8,
  cursor: "pointer",
  fontFamily: "'DM Sans', sans-serif",
  fontWeight: 500,
  fontSize: "1rem",
} as const;

const statusStyles: Record<string, { color: string; background: string; border: string }> = {
  pending: { color: "#FFB36B", background: "rgba(255,179,107,0.12)", border: "rgba(255,179,107,0.3)" },
  accepted: { color: "#86efac", background: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.3)" },
  denied: { color: "#fda4af", background: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
  in_transit: { color: "#7dd3fc", background: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.3)" },
  delivered: { color: "#34d399", background: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)" },
  cancelled: { color: "#cbd5e1", background: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.24)" },
};

const categoryColor = (c: string) => (c === "healthy" ? "#4ade80" : c === "junk" ? "#ff6b6b" : "#FFC93C");

type ModalStep = "idle" | "selectFulfillment" | "confirmDeny" | "confirmComplete";

const normalizeDonation = (item: any): FoodDonation => ({
  id: item.id || item._id,
  _id: item._id,
  donorType: item.donorType,
  donorName: item.donorName,
  donorPhone: item.donorPhone,
  donorLocation: item.donorLocation,
  pickupAddress: item.pickupAddress,
  pickupLat: item.pickupLat,
  pickupLng: item.pickupLng,
  totalPrepared: item.totalPrepared,
  remaining: item.remaining,
  category: item.category,
  description: item.description,
  photo: item.photo,
  createdAt: item.createdAt || new Date().toISOString(),
  status: item.status === "completed" ? "delivered" : item.status === "picked_up" ? "in_transit" : item.status,
  fulfillmentType: item.fulfillmentType ?? null,
  acceptedByNgo: item.acceptedByNgo,
  acceptedAt: item.acceptedAt,
  deniedAt: item.deniedAt,
  deliveredAt: item.deliveredAt,
  completionConfirmed: item.completionConfirmed,
  completionNote: item.completionNote,
  pickupConfirmedByNgo: item.pickupConfirmedByNgo,
  deliveryConfirmedByNgo: item.deliveryConfirmedByNgo,
  ngoActionHistory: item.ngoActionHistory || [],
  rating: item.rating,
});

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-";

const ngoDisplayName = (ngo: any, fallback?: string) =>
  ngo?.profile?.ngoName || ngo?.profile?.businessName || ngo?.profile?.name || ngo?.email || fallback || "Assigned NGO";

export default function NGORequests() {
  const { donations, updateDonation, profile } = useUser();
  const [requests, setRequests] = useState<FoodDonation[]>([]);
  const [selected, setSelected] = useState<FoodDonation | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modalStep, setModalStep] = useState<ModalStep>("idle");
  const [actionError, setActionError] = useState("");
  const [completionNote, setCompletionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError("");

    fetchDonations()
      .then((data) => {
        if (!cancelled) {
          const filtered = data.filter((d: any) => !d.acceptedByNgo || (d.acceptedByNgo?._id || d.acceptedByNgo?.id || d.acceptedByNgo) === profile.id);
          setRequests(filtered.map(normalizeDonation));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setRequests(donations.map(normalizeDonation));
          setLoadError("Showing local request data. Start the backend for live NGO workflow persistence.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [donations]);

  const sortedRequests = useMemo(
    () =>
      [...requests].sort((a, b) => {
        const order = { pending: 0, accepted: 1, in_transit: 2, delivered: 3, denied: 4, cancelled: 5 } as Record<string, number>;
        return (order[a.status] ?? 99) - (order[b.status] ?? 99) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }),
    [requests]
  );

  const pendingCount = sortedRequests.filter((d) => d.status === "pending").length;

  const syncDonation = (updated: any) => {
    const next = normalizeDonation(updated);
    setRequests((items) => items.map((item) => ((item._id || item.id) === (next._id || next.id) ? next : item)));
    updateDonation(next.id, next);
    setSelected(next);
    return next;
  };

  const resetActionState = () => {
    setModalStep("idle");
    setActionError("");
    setCompletionNote("");
    setIsSubmitting(false);
  };

  const openModal = (donation: FoodDonation) => {
    setSelected(donation);
    resetActionState();
  };

  const handleChooseFulfillment = async (fulfillmentType: "pickup" | "delivery") => {
    if (!selected?._id) {
      setActionError("This request is not synced with the backend yet.");
      return;
    }

    setIsSubmitting(true);
    setActionError("");
    try {
      const accepted = await acceptDonationRequestApi(selected._id);
      syncDonation(accepted);
      const fulfilled = await setDonationFulfillmentApi(selected._id, fulfillmentType);
      syncDonation(fulfilled);
      setModalStep("idle");
    } catch (error: any) {
      setActionError(error.message || "Could not accept this donation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeny = async () => {
    if (!selected?._id) {
      setActionError("This request is not synced with the backend yet.");
      return;
    }

    setIsSubmitting(true);
    setActionError("");
    try {
      const denied = await denyDonationRequestApi(selected._id);
      syncDonation(denied);
      setModalStep("idle");
    } catch (error: any) {
      setActionError(error.message || "Could not deny this donation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!selected?._id) {
      setActionError("This request is not synced with the backend yet.");
      return;
    }

    setIsSubmitting(true);
    setActionError("");
    try {
      const completed = await completeDonationApi(selected._id, { completionNote: completionNote.trim() || undefined });
      syncDonation(completed);
      setModalStep("idle");
    } catch (error: any) {
      setActionError(error.message || "Could not complete this donation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedStatusStyle = selected ? statusStyles[selected.status] || statusStyles.pending : statusStyles.pending;

  return (
    <div className="bs-root">
      <AppNav active="Home" />

      <div style={{ paddingTop: 110, padding: "110px 2rem 6rem", maxWidth: 1200, margin: "0 auto" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.18em", color: "rgba(255, 255, 255, 0.9)", textTransform: "uppercase", fontWeight: 600 }}>
          Incoming Requests
        </span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.4rem, 4vw, 4rem)", color: "rgba(255, 255, 255, 0.95)", margin: "1rem 0 0.5rem", fontWeight: 700, lineHeight: 1.2 }}>
          Pickup Requests From Donors
        </h1>
        <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", marginBottom: 10, fontSize: "1rem", lineHeight: 1.65 }}>
          {pendingCount} pending request{pendingCount !== 1 ? "s" : ""}. Accept with pickup or delivery, then confirm the rescue when food is completed.
        </p>
        {loadError && <p style={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif", marginBottom: 28, fontSize: "1rem", lineHeight: 1.65 }}>{loadError}</p>}

        {loading ? (
          <div style={{ ...card, cursor: "default", textAlign: "center", padding: "4rem" }}>
            <p style={{ color: "rgba(255, 255, 255, 0.78)", fontSize: "1rem", lineHeight: 1.65 }}>Loading donor requests...</p>
          </div>
        ) : sortedRequests.length === 0 ? (
          <div style={{ ...card, cursor: "default", textAlign: "center", padding: "4rem" }}>
            <p style={{ color: "rgba(255, 255, 255, 0.78)", fontSize: "1rem", lineHeight: 1.65 }}>No requests right now. Check back soon.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 20 }}>
            {sortedRequests.map((donation) => {
              const statusStyle = statusStyles[donation.status] || statusStyles.pending;
              return (
                <div
                  key={donation._id || donation.id}
                  style={{ ...card, borderColor: statusStyle.border }}
                  onClick={() => openModal(donation)}
                >
                  {donation.photo && (
                    <img src={donation.photo} alt="food" style={{ width: "100%", height: 160, objectFit: "cover", borderRadius: 10, marginBottom: 14 }} />
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, gap: 8 }}>
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.95rem",
                        letterSpacing: "0.12em",
                        color: statusStyle.color,
                        background: statusStyle.background,
                        border: `1px solid ${statusStyle.border}`,
                        padding: "0.5rem 1rem",
                        borderRadius: 999,
                        textTransform: "capitalize",
                      }}
                    >
                      {donation.status.replace("_", " ")}
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.95rem",
                        color: categoryColor(donation.category),
                        background: `${categoryColor(donation.category)}20`,
                        padding: "0.5rem 1rem",
                        borderRadius: 12,
                        textTransform: "capitalize",
                      }}
                    >
                      {donation.category}
                    </span>
                  </div>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", color: "rgba(255, 255, 255, 0.95)", fontSize: "1.25rem", margin: "0 0 6px", fontWeight: 600, lineHeight: 1.4 }}>{donation.donorName}</h3>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255, 255, 255, 0.78)", marginBottom: 10, lineHeight: 1.65 }}>
                    {donation.donorLocation}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255, 255, 255, 0.95)", marginBottom: 10 }}>
                    <strong style={{ color: "#FF5722" }}>{donation.remaining}</strong> available
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {donation.fulfillmentType && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "0.5rem 1rem", textTransform: "capitalize" }}>
                        {donation.fulfillmentType}
                      </span>
                    )}
                    {donation.status === "delivered" && (
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "#34d399" }}>
                        Rescue completed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selected && (
        <div
          onClick={() => {
            setSelected(null);
            resetActionState();
          }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.78)",
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#1a1714",
              borderRadius: 18,
              maxWidth: 680,
              width: "100%",
              border: `1px solid ${selectedStatusStyle.border}`,
              overflow: "hidden",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {selected.photo && <img src={selected.photo} alt="food" style={{ width: "100%", height: 240, objectFit: "cover" }} />}
            <div style={{ padding: "2rem" }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
                <span style={{ color: selectedStatusStyle.color, background: selectedStatusStyle.background, border: `1px solid ${selectedStatusStyle.border}`, borderRadius: 999, padding: "0.5rem 1rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", textTransform: "capitalize" }}>
                  {selected.status.replace("_", " ")}
                </span>
                {selected.fulfillmentType && (
                  <span style={{ color: "rgba(255, 255, 255, 0.95)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 999, padding: "0.5rem 1rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", textTransform: "capitalize" }}>
                    {selected.fulfillmentType}
                  </span>
                )}
              </div>

              <h2 style={{ fontFamily: "'Playfair Display', serif", color: "rgba(255, 255, 255, 0.95)", fontSize: "1.8rem", margin: "0 0 6px", fontWeight: 700, lineHeight: 1.2 }}>{selected.donorName}</h2>
              <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", margin: "0 0 18px", textTransform: "capitalize", lineHeight: 1.65 }}>{selected.donorType}</p>

              <div style={{ display: "grid", gap: 10, fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255, 255, 255, 0.95)", marginBottom: 18 }}>
                <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Location:</strong> {selected.pickupAddress || selected.donorLocation}</div>
                <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Phone:</strong> {selected.donorPhone}</div>
                <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Total prepared:</strong> {selected.totalPrepared}</div>
                <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Available for pickup:</strong> <span style={{ color: "#FF5722", fontWeight: 600 }}>{selected.remaining}</span></div>
                <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Accepted by NGO:</strong> {selected.acceptedByNgo ? ngoDisplayName(selected.acceptedByNgo, profile.ngoName) : "Awaiting NGO action"}</div>
                <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Accepted at:</strong> {formatDate(selected.acceptedAt)}</div>
                <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Delivered at:</strong> {formatDate(selected.deliveredAt)}</div>
              </div>

              {selected.description && (
                <div style={{ background: "#0f0d0a", padding: "1rem", borderRadius: 10, marginBottom: 20 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.72)", textTransform: "uppercase", marginBottom: 6, fontWeight: 500 }}>Description</div>
                  <p style={{ color: "rgba(255, 255, 255, 0.95)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65, margin: 0 }}>{selected.description}</p>
                </div>
              )}

              {selected.ngoActionHistory?.length ? (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.72)", textTransform: "uppercase", marginBottom: 10, fontWeight: 500 }}>Action Timeline</div>
                  <div style={{ display: "grid", gap: 10 }}>
                    {selected.ngoActionHistory.map((entry, index) => (
                      <div key={`${entry.action}-${entry.createdAt || index}`} style={{ borderLeft: "2px solid rgba(255,87,34,0.25)", paddingLeft: 12 }}>
                        <div style={{ color: "rgba(255, 255, 255, 0.95)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", textTransform: "capitalize" }}>
                          {entry.action.replace("_", " ")}
                          {entry.fulfillmentType ? ` - ${entry.fulfillmentType}` : ""}
                        </div>
                        <div style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem" }}>{formatDate(entry.createdAt)}</div>
                        {entry.note && <div style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", marginTop: 2, lineHeight: 1.65 }}>{entry.note}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {actionError && <p style={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", marginBottom: 16, lineHeight: 1.65 }}>{actionError}</p>}

              {modalStep === "selectFulfillment" && (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1rem", marginBottom: 18 }}>
                  <div style={{ color: "rgba(255, 255, 255, 0.95)", fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", marginBottom: 8, fontWeight: 600, lineHeight: 1.4 }}>How will this food be fulfilled?</div>
                  <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", marginTop: 0, marginBottom: 16, fontSize: "1rem", lineHeight: 1.65 }}>Choose the rescue method before final acceptance.</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <button type="button" style={actionBtn("#FF5722", isSubmitting)} disabled={isSubmitting} onClick={() => handleChooseFulfillment("pickup")}>
                      {isSubmitting ? "Saving..." : "Pickup"}
                    </button>
                    <button type="button" style={actionBtn("#c97316", isSubmitting)} disabled={isSubmitting} onClick={() => handleChooseFulfillment("delivery")}>
                      {isSubmitting ? "Saving..." : "Delivery"}
                    </button>
                  </div>
                </div>
              )}

              {modalStep === "confirmDeny" && (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1rem", marginBottom: 18 }}>
                  <div style={{ color: "rgba(255, 255, 255, 0.95)", fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", marginBottom: 8, fontWeight: 600, lineHeight: 1.4 }}>Deny this request?</div>
                  <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", marginTop: 0, marginBottom: 16, fontSize: "1rem", lineHeight: 1.65 }}>This will mark the donation as denied and remove fulfillment actions.</p>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" style={actionBtn("#ff6b6b", isSubmitting)} disabled={isSubmitting} onClick={handleDeny}>
                      {isSubmitting ? "Denying..." : "Confirm Deny"}
                    </button>
                    <button type="button" style={ghostBtn} onClick={() => setModalStep("idle")}>Cancel</button>
                  </div>
                </div>
              )}

              {modalStep === "confirmComplete" && (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1rem", marginBottom: 18 }}>
                  <div style={{ color: "rgba(255, 255, 255, 0.95)", fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", marginBottom: 8, fontWeight: 600, lineHeight: 1.4 }}>Mark this donation as completed?</div>
                  <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", marginTop: 0, marginBottom: 12, fontSize: "1rem", lineHeight: 1.65 }}>Are you sure you want to mark this donation as completed?</p>
                  <textarea
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    placeholder="Optional completion note..."
                    style={{
                      width: "100%",
                      minHeight: 84,
                      background: "#0f0d0a",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255, 255, 255, 0.95)",
                      padding: "1rem",
                      borderRadius: 10,
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: "1rem",
                      resize: "vertical",
                      outline: "none",
                      marginBottom: 14,
                    }}
                  />
                  <div style={{ display: "flex", gap: 10 }}>
                    <button type="button" style={actionBtn("#4ade80", isSubmitting)} disabled={isSubmitting} onClick={handleComplete}>
                      {isSubmitting ? "Completing..." : selected.fulfillmentType === "delivery" ? "Confirm Delivery Completed" : "Confirm Pickup Completed"}
                    </button>
                    <button type="button" style={ghostBtn} onClick={() => setModalStep("idle")}>Cancel</button>
                  </div>
                </div>
              )}

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {selected.status === "pending" && modalStep === "idle" && (
                  <>
                    <button type="button" style={actionBtn("#4ade80")} onClick={() => setModalStep("selectFulfillment")}>Accept Request</button>
                    <button type="button" style={actionBtn("#ff6b6b")} onClick={() => setModalStep("confirmDeny")}>Deny</button>
                  </>
                )}

                {selected.status === "accepted" && !selected.fulfillmentType && modalStep === "idle" && (
                  <button type="button" style={actionBtn("#FF5722")} onClick={() => setModalStep("selectFulfillment")}>Choose Pickup or Delivery</button>
                )}

                {(selected.status === "accepted" || selected.status === "in_transit") && selected.fulfillmentType && modalStep === "idle" && (
                  <button type="button" style={actionBtn("#4ade80")} onClick={() => setModalStep("confirmComplete")}>
                    {selected.fulfillmentType === "delivery" ? "Confirm Delivery Completed" : "Confirm Pickup Completed"}
                  </button>
                )}

                {(selected.status === "denied" || selected.status === "delivered" || selected.status === "cancelled") && (
                  <span style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>
                    No further NGO actions are available for this request.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
