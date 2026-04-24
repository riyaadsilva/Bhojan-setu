import { useQuery } from "@tanstack/react-query";
import { useUser, type FoodDonation } from "../contexts/UserContext";
import { fetchMyDonations } from "../services/api";

const card = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  padding: "2rem",
};

const statusStyles: Record<string, { color: string; background: string; border: string }> = {
  pending: { color: "#FFB36B", background: "rgba(255,179,107,0.12)", border: "rgba(255,179,107,0.3)" },
  accepted: { color: "#86efac", background: "rgba(74,222,128,0.12)", border: "rgba(74,222,128,0.3)" },
  denied: { color: "#fda4af", background: "rgba(248,113,113,0.12)", border: "rgba(248,113,113,0.3)" },
  in_transit: { color: "#7dd3fc", background: "rgba(56,189,248,0.12)", border: "rgba(56,189,248,0.3)" },
  delivered: { color: "#34d399", background: "rgba(52,211,153,0.12)", border: "rgba(52,211,153,0.3)" },
  cancelled: { color: "#cbd5e1", background: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.24)" },
};

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

const ngoDisplayName = (ngo: any) =>
  ngo?.profile?.ngoName || ngo?.profile?.businessName || ngo?.profile?.name || ngo?.email || "Assigned NGO";

export default function DonationStatusPanel({
  title = "Donation Status",
  subtitle = "Track each request from posting through rescue completion.",
  maxItems = 6,
}: {
  title?: string;
  subtitle?: string;
  maxItems?: number;
}) {
  const { donations, profile, role } = useUser();
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ["my-donations"],
    queryFn: async () => {
      const result = await fetchMyDonations();
      return result.map(normalizeDonation);
    },
    refetchInterval: 10000, // Poll every 10 seconds
    retry: 1,
  });

  const matchedDonations = (data || donations.map(normalizeDonation))
    .sort((a: FoodDonation, b: FoodDonation) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxItems);

  if (role !== "individual" && role !== "restaurant") return null;

  return (
    <section style={{ padding: "6rem 2rem", background: "#0f0d0a" }}>
      <div style={{ maxWidth: 1040, margin: "0 auto" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.18em", color: "rgba(255, 255, 255, 0.9)", textTransform: "uppercase", fontWeight: 600 }}>
          Rescue Tracking
        </span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "rgba(255, 255, 255, 0.95)", margin: "1rem 0 0.5rem", fontWeight: 700, lineHeight: 1.2 }}>
          {title}
        </h2>
        <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", marginBottom: 22, fontSize: "1rem", lineHeight: 1.65 }}>{subtitle}</p>
        {error && <p style={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif", marginBottom: 18, fontSize: "1rem", lineHeight: 1.65 }}>Showing saved donation history. Start the backend to sync live rescue status.</p>}

        {loading ? (
          <div style={{ ...card, textAlign: "center", color: "rgba(255, 255, 255, 0.78)", fontSize: "1rem", lineHeight: 1.65 }}>Loading donation updates...</div>
        ) : matchedDonations.length === 0 ? (
          <div style={{ ...card, textAlign: "center", color: "rgba(255, 255, 255, 0.78)", fontSize: "1rem", lineHeight: 1.65 }}>No donation updates yet. Once a request is posted, its live rescue status will appear here.</div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {matchedDonations.map((item) => {
              const statusStyle = statusStyles[item.status] || statusStyles.pending;
              return (
                <div key={item._id || item.id} style={{ ...card, borderColor: statusStyle.border, display: "grid", gridTemplateColumns: "120px minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
                  <img
                    src={item.photo || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300"}
                    alt={item.donorName}
                    style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12 }}
                  />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
                      <span style={{ color: statusStyle.color, background: statusStyle.background, border: `1px solid ${statusStyle.border}`, borderRadius: 999, padding: "0.5rem 1rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", textTransform: "capitalize" }}>
                        {item.status.replace("_", " ")}
                      </span>
                      {item.fulfillmentType && (
                        <span style={{ color: "rgba(255, 255, 255, 0.95)", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", borderRadius: 999, padding: "0.5rem 1rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", textTransform: "capitalize" }}>
                          {item.fulfillmentType}
                        </span>
                      )}
                    </div>

                    <h3 style={{ fontFamily: "'Playfair Display', serif", color: "rgba(255, 255, 255, 0.95)", fontSize: "1.25rem", margin: "0 0 6px", fontWeight: 600, lineHeight: 1.4 }}>{item.remaining}</h3>
                    <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", margin: "0 0 14px", lineHeight: 1.65 }}>
                      {item.pickupAddress || item.donorLocation}
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255, 255, 255, 0.95)" }}>
                      <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Posted:</strong> {formatDate(item.createdAt)}</div>
                      <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Accepted:</strong> {formatDate(item.acceptedAt)}</div>
                      <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Completed:</strong> {formatDate(item.deliveredAt)}</div>
                      <div><strong style={{ color: "rgba(255, 255, 255, 0.72)", fontWeight: 400 }}>Handled by:</strong> {item.acceptedByNgo ? ngoDisplayName(item.acceptedByNgo) : "Awaiting NGO"}</div>
                    </div>

                    {item.completionConfirmed && (
                      <div style={{ marginTop: 12, color: "#34d399", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>
                        Food rescue completed successfully.
                      </div>
                    )}
                    {item.completionNote && (
                      <div style={{ marginTop: 8, color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>
                        Note: {item.completionNote}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
