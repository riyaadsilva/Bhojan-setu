import { useState } from "react";
import { useUser } from "../contexts/UserContext";
import DonationLocationPicker, { PickupLocation } from "./DonationLocationPicker";
import { createDonationPost } from "../services/api";

const card = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  padding: "2rem",
};
const label = { fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.72)", marginBottom: 6, display: "block", fontWeight: 500 };
const input = {
  width: "100%", background: "#0f0d0a", border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255, 255, 255, 0.95)", padding: "1rem", borderRadius: 10, fontFamily: "'DM Sans', sans-serif",
  fontSize: "1rem", outline: "none",
} as const;
const btn = {
  background: "#FF5722", color: "#fff", border: "none", padding: "1rem 2rem",
  borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
  fontSize: "1rem", cursor: "pointer",
};

export default function IndividualDonateForm() {
  const { profile, addDonation } = useUser();
  const [form, setForm] = useState({
    totalPrepared: "", remaining: "", category: "normal" as "junk" | "normal" | "healthy",
    description: "",
  });
  const [pickupLocation, setPickupLocation] = useState<PickupLocation>({});
  const [photo, setPhoto] = useState<string | undefined>();
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError("Photo must be smaller than 10 MB.");
      return;
    }
    setError("");
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.totalPrepared || !form.remaining) {
      setError("Please fill in food amounts.");
      return;
    }

    const donorLocation = pickupLocation.address || profile.location || "Pickup address pending";
    const payload = {
      donorType: "individual" as const,
      donorName: profile.name || "Anonymous",
      donorPhone: profile.phone || "Not provided",
      donorLocation,
      pickupAddress: donorLocation,
      pickupLat: pickupLocation.lat,
      pickupLng: pickupLocation.lng,
      ...form,
      photo,
    };

    setIsSubmitting(true);
    setError("");
    addDonation(payload);
    try {
      await createDonationPost(payload);
    } catch {
      setError("Saved locally. Backend API is not reachable, so sync will retry when the server is connected.");
    }
    setSubmitted(true);
    setForm({ totalPrepared: "", remaining: "", category: "normal", description: "" });
    setPickupLocation({});
    setPhoto(undefined);
    setIsSubmitting(false);
    setTimeout(() => setSubmitted(false), 4000);
  };

  return (
    <section style={{ padding: "6rem 2rem", background: "#0f0d0a" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.18em", color: "rgba(255, 255, 255, 0.9)", textTransform: "uppercase", fontWeight: 600 }}>
          Donate Your Surplus
        </span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "rgba(255, 255, 255, 0.95)", margin: "1rem 0 0.5rem", fontWeight: 700, lineHeight: 1.2 }}>
          Share Your Leftover Food
        </h2>
        <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", marginBottom: 28, fontSize: "1rem", lineHeight: 1.65 }}>
          Tell us how much food you have. NGOs nearby will be notified for pickup.
        </p>

        <form onSubmit={handleSubmit} style={card}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={label}>Total Food Prepared</label>
              <input style={input} placeholder="e.g. 50 plates / 20 kg" value={form.totalPrepared}
                onChange={(e) => setForm({ ...form, totalPrepared: e.target.value })} />
            </div>
            <div>
              <label style={label}>Remaining Food</label>
              <input style={input} placeholder="e.g. 12 plates / 5 kg" value={form.remaining}
                onChange={(e) => setForm({ ...form, remaining: e.target.value })} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Food Category</label>
            <div style={{ display: "flex", gap: 10 }}>
              {(["healthy", "normal", "junk"] as const).map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, category: c })}
                  style={{
                    flex: 1, padding: "0.75rem 1rem", borderRadius: 10,
                    background: form.category === c ? "#FF5722" : "transparent",
                    color: form.category === c ? "#fff" : "rgba(255, 255, 255, 0.72)",
                    border: `1px solid ${form.category === c ? "#FF5722" : "rgba(255,255,255,0.12)"}`,
                    cursor: "pointer", textTransform: "capitalize",
                    fontFamily: "'DM Sans', sans-serif", fontSize: "1rem",
                  }}>{c}</button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Description</label>
            <textarea style={{ ...input, minHeight: 80, resize: "vertical" } as any}
              placeholder="Briefly describe the food (cuisine, packaging, freshness)…"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <DonationLocationPicker value={pickupLocation} onChange={setPickupLocation} />

          <div style={{ marginBottom: 20 }}>
            <label style={label}>Upload Photo (max 10 MB)</label>
            <input type="file" accept="image/*" onChange={handleFile}
              style={{ ...input, padding: 10 }} />
            {photo && (
              <img src={photo} alt="preview" style={{ marginTop: 12, maxWidth: 200, borderRadius: 10, border: "1px solid rgba(255,255,255,0.12)" }} />
            )}
          </div>

          {error && <p style={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", marginBottom: 14, lineHeight: 1.65 }}>{error}</p>}
          {submitted && <p style={{ color: "#4ade80", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", marginBottom: 14, lineHeight: 1.65 }}>Donation posted! Nearby NGOs can now see pickup distance and route details.</p>}

          <button type="submit" style={{ ...btn, opacity: isSubmitting ? 0.7 : 1 }} disabled={isSubmitting}>
            {isSubmitting ? "Posting..." : "Post Donation"}
          </button>
        </form>
      </div>
    </section>
  );
}
