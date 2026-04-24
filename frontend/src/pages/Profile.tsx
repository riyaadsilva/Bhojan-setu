import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import AppNav from "../components/AppNav";
import DonationStatusPanel from "../components/DonationStatusPanel";

const labelMap: Record<string, string> = {
  name: "Full Name",
  birthDate: "Birth Date",
  phone: "Phone Number",
  email: "Email",
  location: "Location",
  password: "Password",
  businessName: "Business Name",
  ownerName: "Owner Name",
  establishedDate: "Established Date",
  fssai: "FSSAI License",
  address: "Address",
  cuisine: "Cuisine Type",
  ngoName: "NGO Name",
  regNumber: "Registration Number",
  website: "Website",
  area: "Operating Area",
  cause: "Cause / Focus",
};

export default function Profile() {
  const { profile, role, donations } = useUser();
  const navigate = useNavigate();

  const impactScore = donations.length * 50 + (role === "restaurant" ? 100 : 0);
  const badges = [];
  if (donations.length > 0) badges.push({ title: "First Step", emoji: "🌱", color: "#4ade80" });
  if (donations.length >= 3) badges.push({ title: "Waste Warrior", emoji: "⚔️", color: "#FF5722" });
  if (donations.length >= 10) badges.push({ title: "Community Hero", emoji: "🦸", color: "#3b82f6" });
  if (role === "restaurant") badges.push({ title: "Certified Partner", emoji: "🏅", color: "#eab308" });

  const entries = Object.entries(profile).filter(([k]) => k !== "password");

  return (
    <div className="bs-root">
      <AppNav active="" />
      <div style={{ paddingTop: 110, padding: "110px 2rem 6rem", maxWidth: 760, margin: "0 auto" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.18em", color: "rgba(255, 255, 255, 0.9)", textTransform: "uppercase", fontWeight: 600 }}>
          Your Account
        </span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.4rem, 4vw, 4rem)", color: "rgba(255, 255, 255, 0.95)", margin: "1rem 0 2rem", fontWeight: 700, lineHeight: 1.2 }}>
          Profile Information
        </h1>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, padding: "2rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 28, paddingBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{
              width: 70, height: 70, borderRadius: "50%", background: "#FF5722",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "2rem", color: "#fff", fontFamily: "'Playfair Display', serif",
            }}>
              {(profile.name || profile.businessName || profile.ngoName || "U")[0]}
            </div>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", color: "rgba(255, 255, 255, 0.95)", fontWeight: 600, lineHeight: 1.4 }}>
                {profile.name || profile.businessName || profile.ngoName || "User"}
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255, 255, 255, 0.78)", textTransform: "capitalize" }}>
                {role} account
              </div>
            </div>
          </div>

          {entries.length === 0 ? (
            <p style={{ color: "rgba(255, 255, 255, 0.78)", fontSize: "1rem", lineHeight: 1.65 }}>No information on file yet.</p>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
              {entries.map(([k, v]) => (
                <div key={k}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.72)", textTransform: "uppercase", marginBottom: 4, fontWeight: 500 }}>
                    {labelMap[k] || k}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255, 255, 255, 0.95)" }}>
                    {v || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(role === "individual" || role === "restaurant") && (
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20, padding: "2rem", marginTop: 20,
          }}>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", color: "rgba(255, 255, 255, 0.95)", fontWeight: 600, marginBottom: 16 }}>
              Your Impact
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: "3rem", fontWeight: 700, color: "#FF5722", fontFamily: "'Playfair Display', serif", lineHeight: 1 }}>{impactScore}</span>
              <span style={{ color: "rgba(255, 255, 255, 0.72)", fontFamily: "'DM Sans', sans-serif" }}>Impact Points</span>
            </div>
            
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.1em", color: "rgba(255, 255, 255, 0.72)", textTransform: "uppercase", marginBottom: 12, fontWeight: 500 }}>
              Earned Badges
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {badges.length > 0 ? badges.map((badge, i) => (
                <div key={i} style={{ 
                  display: "flex", alignItems: "center", gap: 8, 
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${badge.color}40`, 
                  padding: "8px 16px", borderRadius: 30, fontFamily: "'DM Sans', sans-serif", color: "rgba(255, 255, 255, 0.95)"
                }}>
                  <span style={{ fontSize: "1.2rem" }}>{badge.emoji}</span>
                  <span style={{ fontWeight: 500 }}>{badge.title}</span>
                </div>
              )) : (
                <span style={{ color: "rgba(255, 255, 255, 0.5)", fontFamily: "'DM Sans', sans-serif" }}>Make your first donation to earn a badge!</span>
              )}
            </div>
          </div>
        )}

        <button
          onClick={() => navigate("/dashboard")}
          style={{
            marginTop: 24, background: "transparent", border: "1px solid rgba(255,255,255,0.12)",
            color: "rgba(255, 255, 255, 0.72)", padding: "1rem 2rem", borderRadius: 8, cursor: "pointer",
            fontFamily: "'DM Sans', sans-serif", fontSize: "1rem",
          }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {(role === "individual" || role === "restaurant") && (
        <DonationStatusPanel
          title="Donation Timeline"
          subtitle="A read-only view of every rescue update tied to your posted food donations."
          maxItems={4}
        />
      )}
    </div>
  );
}
