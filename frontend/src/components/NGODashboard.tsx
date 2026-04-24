import { motion } from "framer-motion";

const stats = [
  { label: "People Helped", value: "12,400+", icon: "🍽️" },
  { label: "Restaurants Connected", value: "156", icon: "🏪" },
  { label: "Meals Distributed", value: "48,200+", icon: "📦" },
];

const stories = [
  {
    title: "200 families fed in Dharavi this week",
    body: "Thanks to surplus from 12 restaurants, our volunteers distributed hot meals across 5 community centers.",
    date: "2 days ago",
  },
  {
    title: "New partnership with Annapurna Kitchen",
    body: "Annapurna Kitchen joins our network, pledging to donate surplus from their 3 outlets every evening.",
    date: "4 days ago",
  },
  {
    title: "Monthly milestone: 5,000 meals redistributed",
    body: "This month we crossed 5,000 meals redistributed — a 32% increase from last month.",
    date: "1 week ago",
  },
];

export default function NGODashboard() {
  return (
    <div className="bs-ngo-section">
      <div className="bs-section-inner">
        <span className="bs-section-label">Your Impact</span>
        <h2 className="bs-hiw-title" style={{ marginBottom: 32, textAlign: "center" }}>Making a Difference Together</h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 48 }}>
          {stats.map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 14,
                padding: "28px 24px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "2rem", fontWeight: 700, color: "#FF5722" }}>{s.value}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.85rem", color: "#8a7e6e", marginTop: 4 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.5rem", fontWeight: 700, color: "#f2ede4", marginBottom: 20, textAlign: "center" }}>
          📰 Recent Stories
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {stories.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                padding: "24px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <h4 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.1rem", fontWeight: 700, color: "#f2ede4", margin: 0 }}>{s.title}</h4>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "#6b5b44", whiteSpace: "nowrap", marginLeft: 16 }}>{s.date}</span>
              </div>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", color: "#8a7e6e", lineHeight: 1.7, margin: 0 }}>{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
