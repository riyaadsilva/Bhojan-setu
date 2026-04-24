import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useUser } from "../contexts/UserContext";
import AppNav from "../components/AppNav";
import DonationStatusPanel from "../components/DonationStatusPanel";
import IndividualDonateForm from "../components/IndividualDonateForm";
import Slideshow from "../components/Slideshow";
import FoodLogSection from "../components/FoodLogSection";
import NGORequests from "./NGORequests";
import "./Mainlanding.css";

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 36 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.85, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
});
const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.9, delay },
});

const heroText: Record<string, { headline: React.ReactNode; sub: string; searchPlaceholder: string }> = {
  individual: {
    headline: <>Every Meal You Share<br /><em className="bs-accent">Matters.</em></>,
    sub: "Turn your leftover food into hope for someone who needs it.",
    searchPlaceholder: "Enter your location to find nearby NGOs...",
  },
  restaurant: {
    headline: <>Smart Kitchens.<br /><em className="bs-accent">Zero Waste.</em><br />Full Plates.</>,
    sub: "Connecting surplus food from restaurants & kitchens to communities that need it most.",
    searchPlaceholder: "Enter your location to find nearby NGOs...",
  },
  ngo: {
    headline: <>Connecting Food<br /><em className="bs-accent">To Those In Need.</em></>,
    sub: "Manage pickups, track impact, and build stronger community partnerships.",
    searchPlaceholder: "",
  },
};

const steps = [
  { num: "01", icon: <BigIcon type="analyze" />, title: "Production Analysis", body: "Submit daily data to optimise batch production and reduce waste before it ever happens." },
  { num: "02", icon: <BigIcon type="surplus" />, title: "Register Surplus", body: "Easily log leftover food for immediate donation — done in under 60 seconds." },
  { num: "03", icon: <BigIcon type="ngo" />, title: "Connecting NGOs", body: "Alert nearby partners for seamless pickup and distribution to those who need it." },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { role } = useUser();
  const currentRole = role === "restaurant" || role === "ngo" || role === "individual" ? role : "individual";

  // NGO dashboard is entirely different — render dedicated component
  if (currentRole === "ngo") {
    return <NGORequests />;
  }

  const hero = heroText[currentRole];

  return (
    <div className="bs-root">
      <AppNav active="Home" />

      {/* HERO */}
      <section className="bs-hero">
        <div className="bs-hero-bg" />
        <div className="bs-hero-overlay" />
        <div className="bs-hero-body">
          <motion.span className="bs-badge" {...fadeUp(0.15)}>
            🌱 &nbsp;Social Impact Platform
          </motion.span>
          <motion.h1 className="bs-headline" {...fadeUp(0.28)}>
            {hero.headline}
          </motion.h1>
          <motion.p className="bs-sub" {...fadeUp(0.42)}>
            {hero.sub}
          </motion.p>

          <motion.div className="bs-search-wrap" {...fadeUp(0.54)}>
            <button className="bs-btn-orange bs-search-btn" onClick={() => navigate("/contact-ngos")} style={{ padding: "14px 28px", fontSize: "1rem" }}>Find Partner NGOs →</button>
            <p className="bs-proof" style={{ marginTop: 16 }}>Join&nbsp;<strong>500+ restaurants</strong>&nbsp;reducing waste today.</p>
          </motion.div>

          {currentRole === "restaurant" && (
            <motion.div className="bs-hero-steps" {...fadeIn(0.78)}>
              <div className="bs-hs"><MiniIcon type="analyze" /><span>1. Production Analysis</span></div>
              <DashedArrow />
              <div className="bs-hs"><MiniIcon type="surplus" /><span>2. Register Surplus</span></div>
              <DashedArrow />
              <div className="bs-hs"><MiniIcon type="ngo" /><span>3. Connect NGOs</span></div>
            </motion.div>
          )}
        </div>
      </section>

      {/* INDIVIDUAL: donation form */}
      {currentRole === "individual" && <IndividualDonateForm />}

      {/* RESTAURANT: food log only (chart moved to /analytics) */}
      {currentRole === "restaurant" && <FoodLogSection />}

      {(currentRole === "individual" || currentRole === "restaurant") && (
        <DonationStatusPanel
          title={currentRole === "restaurant" ? "Rescue Status For Your Surplus Food" : "Track Your Donation Requests"}
          subtitle={
            currentRole === "restaurant"
              ? "Follow each accepted pickup or delivery from NGO action through final completion."
              : "See when an NGO accepts your food, chooses pickup or delivery, and confirms the rescue."
          }
        />
      )}

      {/* HOW IT WORKS */}
      <section className="bs-hiw" id="how-it-works">
        <motion.div className="bs-hiw-inner" initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}>
          <span className="bs-section-label">The Process</span>
          <h2 className="bs-hiw-title">How BhojanSetu Works</h2>
          <div className="bs-cards">
            {steps.map((s, i) => (
              <motion.div key={s.num} className="bs-card" initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, delay: i * 0.14, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}>
                <span className="bs-card-num">{s.num}</span>
                <div className="bs-card-icon">{s.icon}</div>
                <h3 className="bs-card-title">{s.title}</h3>
                <p className="bs-card-body">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* SLIDESHOW (individual & restaurant) */}
      <Slideshow />
    </div>
  );
}

// SVG Components
function DashedArrow() {
  return (
    <svg className="bs-arrow" viewBox="0 0 56 20" fill="none">
      <path d="M2 10 Q28 2 54 10" stroke="#FF5722" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M48 5 L54 10 L48 15" stroke="#FF5722" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MiniIcon({ type }: { type: string }) {
  if (type === "analyze") return (
    <svg viewBox="0 0 28 28" fill="none" className="bs-mini-svg">
      <rect x="5" y="3" width="18" height="22" rx="2.5" stroke="white" strokeWidth="1.4"/>
      <rect x="9" y="15" width="2" height="5" fill="white"/><rect x="13" y="12" width="2" height="8" fill="white"/>
      <rect x="17" y="9" width="2" height="11" fill="white" opacity="0.6"/><circle cx="19" cy="8" r="2.5" fill="#FF5722"/>
    </svg>
  );
  if (type === "surplus") return (
    <svg viewBox="0 0 28 28" fill="none" className="bs-mini-svg">
      <rect x="5" y="11" width="18" height="13" rx="2.5" stroke="white" strokeWidth="1.4"/>
      <path d="M10 11V9a4 4 0 0 1 8 0v2" stroke="white" strokeWidth="1.4"/>
      <path d="M14 15v4M12 17h4" stroke="#FF5722" strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 28 28" fill="none" className="bs-mini-svg">
      <circle cx="7" cy="20" r="2.5" stroke="white" strokeWidth="1.4"/><circle cx="21" cy="20" r="2.5" stroke="white" strokeWidth="1.4"/>
      <circle cx="14" cy="7" r="2.5" stroke="#FF5722" strokeWidth="1.4"/>
      <path d="M7 20 L14 7 L21 20" stroke="white" strokeWidth="1.4" strokeLinejoin="round"/>
    </svg>
  );
}

function BigIcon({ type }: { type: string }) {
  if (type === "analyze") return (
    <svg viewBox="0 0 52 52" fill="none" className="bs-big-svg">
      <rect x="8" y="4" width="36" height="44" rx="5" stroke="#FF5722" strokeWidth="2"/>
      <rect x="17" y="28" width="4" height="12" fill="#FF5722" opacity="0.5"/><rect x="24" y="22" width="4" height="18" fill="#FF5722"/>
      <rect x="31" y="16" width="4" height="24" fill="#FF5722" opacity="0.7"/><circle cx="37" cy="13" r="5" fill="#FF5722"/>
      <path d="M35 13 L37 15 L41 11" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  if (type === "surplus") return (
    <svg viewBox="0 0 52 52" fill="none" className="bs-big-svg">
      <rect x="7" y="20" width="38" height="26" rx="5" stroke="#FF5722" strokeWidth="2"/>
      <path d="M15 20V17a11 11 0 0 1 22 0v3" stroke="#FF5722" strokeWidth="2"/>
      <path d="M26 30v6M23 33h6" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 42 Q26 48 36 42" stroke="#FF5722" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.45"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 52 52" fill="none" className="bs-big-svg">
      <rect x="4" y="30" width="26" height="16" rx="3" stroke="#FF5722" strokeWidth="2"/>
      <circle cx="12" cy="46" r="3" stroke="#FF5722" strokeWidth="1.5"/><circle cx="23" cy="46" r="3" stroke="#FF5722" strokeWidth="1.5"/>
      <circle cx="38" cy="14" r="5" stroke="white" strokeWidth="1.5"/><circle cx="47" cy="9" r="3" stroke="white" strokeWidth="1.5"/>
      <circle cx="47" cy="21" r="3" stroke="white" strokeWidth="1.5"/>
      <path d="M43 14 L38 14" stroke="#FF5722" strokeWidth="1.5"/><path d="M44 10 L38 12" stroke="white" strokeWidth="1.2" opacity="0.5"/>
      <path d="M44 20 L38 17" stroke="white" strokeWidth="1.2" opacity="0.5"/>
      <path d="M4 38 Q15 30 30 35" stroke="#FF5722" strokeWidth="1.5" strokeDasharray="3 2" fill="none"/>
    </svg>
  );
}
