import AppNav from "../components/AppNav";
import { useUser } from "../contexts/UserContext";
import { rateDonationApi } from "../services/api";

const card = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20, padding: "2rem",
};

function Star({ filled, onClick }: { filled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none", cursor: "pointer", padding: 2,
      fontSize: "1.8rem", color: filled ? "#FFC93C" : "#3a342d",
    }}>★</button>
  );
}

export default function ConnectedRestaurants() {
  const { donations, updateDonation } = useUser();
  const accepted = donations.filter((d) => d.status === "accepted");

  const rate = (id: string, rating: number) => {
    updateDonation(id, { rating });
    rateDonationApi(id, rating).catch(() => {
      // Optimistic local ratings keep the demo flow usable when a seeded local item is not in MongoDB.
    });
  };

  return (
    <div className="bs-root">
      <AppNav active="Connected Restaurants" />

      <div style={{ paddingTop: 110, padding: "110px 2rem 6rem", maxWidth: 1200, margin: "0 auto" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.18em", color: "rgba(255, 255, 255, 0.9)", textTransform: "uppercase", fontWeight: 600 }}>
          Your Donor Network
        </span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.4rem, 4vw, 4rem)", color: "rgba(255, 255, 255, 0.95)", margin: "1rem 0 0.5rem", fontWeight: 700, lineHeight: 1.2 }}>
          Connected Restaurants & Donors
        </h1>
        <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", marginBottom: 28, fontSize: "1rem", lineHeight: 1.65 }}>
          {accepted.length} donor{accepted.length !== 1 ? "s" : ""} have shared food with you. Rate them to build trust in the network.
        </p>

        {accepted.length === 0 ? (
          <div style={{ ...card, textAlign: "center", padding: "4rem" }}>
            <p style={{ color: "rgba(255, 255, 255, 0.78)", fontSize: "1rem", lineHeight: 1.65 }}>You haven't accepted any pickups yet. Visit the home page to review requests.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
            {accepted.map((d) => (
              <div key={d.id} style={{ ...card, display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 20, alignItems: "center" }}>
                <img src={d.photo || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300"}
                  alt={d.donorName}
                  style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 12 }} />

                <div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 4 }}>
                    <h3 style={{ fontFamily: "'Playfair Display', serif", color: "rgba(255, 255, 255, 0.95)", fontSize: "1.25rem", margin: 0, fontWeight: 600, lineHeight: 1.4 }}>{d.donorName}</h3>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.9)", textTransform: "uppercase", background: "rgba(255,87,34,0.12)", padding: "0.5rem 1rem", borderRadius: 10, fontWeight: 500 }}>
                      {d.donorType}
                    </span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255, 255, 255, 0.78)", marginBottom: 8, lineHeight: 1.65 }}>
                    📍 {d.donorLocation} · 📞 {d.donorPhone}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255, 255, 255, 0.95)" }}>
                    Donated <strong style={{ color: "#FF5722" }}>{d.remaining}</strong> ({d.category} food)
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.72)", textTransform: "uppercase", marginBottom: 4, fontWeight: 500 }}>
                    Your rating
                  </div>
                  <div>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} filled={(d.rating || 0) >= n} onClick={() => rate(d.id, n)} />
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
