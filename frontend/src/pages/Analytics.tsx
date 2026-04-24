import AppNav from "../components/AppNav";
import AnalyticsChart from "../components/AnalyticsChart";
import { useUser } from "../contexts/UserContext";

export default function Analytics() {
  const { role } = useUser();

  return (
    <div className="bs-root">
      <AppNav active="Production Analytics" />

      <div style={{ paddingTop: 110, padding: "110px 2rem 2.5rem", maxWidth: 1200, margin: "0 auto" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.18em", color: "rgba(255, 255, 255, 0.9)", textTransform: "uppercase", fontWeight: 600 }}>
          {role === "individual" ? "Donation Rescue Snapshot" : "This Week's Performance"}
        </span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "rgba(255, 255, 255, 0.95)", margin: "1rem 0 0.5rem", fontWeight: 700, lineHeight: 1.2 }}>
          {role === "individual" ? "Donation Analytics" : "Production Analytics"}
        </h1>
        <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>
          {role === "individual"
            ? "Track your total donations, rescue efficiency, and donations that may still turn into waste."
            : "Track how much food was prepared, donated, and wasted across daily, weekly, and monthly views."}
        </p>
      </div>
      <AnalyticsChart />
    </div>
  );
}
