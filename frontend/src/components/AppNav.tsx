import { useLocation, useNavigate } from "react-router-dom";
import { useUser, UserRole } from "../contexts/UserContext";
import { motion } from "framer-motion";
import { useState } from "react";

const fadeIn = (delay = 0) => ({
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: 0.9, delay },
});

const navLinks: Record<string, { label: string; path: string }[]> = {
  individual: [
    { label: "Home", path: "/dashboard" },
    { label: "Production Analytics", path: "/analytics" },
    { label: "Contact NGOs", path: "/contact-ngos" },
    { label: "Impact Stories", path: "/impact-stories" },
  ],
  restaurant: [
    { label: "Home", path: "/dashboard" },
    { label: "Production Analytics", path: "/analytics" },
    { label: "Partner NGOs", path: "/contact-ngos" },
    { label: "Impact Stories", path: "/impact-stories" },
  ],
  ngo: [
    { label: "Home", path: "/dashboard" },
    { label: "Connected Restaurants", path: "/connected" },
    { label: "Impact Stories", path: "/impact-stories" },
  ],
};

export default function AppNav({ active }: { active: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, profile, logout } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const currentRole = (role === "restaurant" || role === "ngo" || role === "individual" ? role : "individual") as UserRole;
  const links = navLinks[currentRole] || navLinks.individual;

  const handleLogout = () => {
    logout();
    navigate("/select-role");
  };

  const go = (path: string) => {
    setMenuOpen(false);
    navigate(path);
  };

  const displayName =
    profile?.name || profile?.businessName || profile?.ngoName || "User";

  const isActive = (link: { label: string; path: string }) =>
    location.pathname === link.path || active === link.label;

  return (
    <motion.header className="bs-nav" {...fadeIn(0)}>
      <div className="bs-logo" style={{ cursor: "pointer" }} onClick={() => navigate("/dashboard")}>
        <div className="bs-logo-mark">भ</div>
        <div>
          <div className="bs-logo-name">BhojanSetu</div>
          <div className="bs-logo-tagline">Smart Food Redistribution</div>
        </div>
      </div>
      <nav className="bs-links">
        {links.map((l) => (
          <a
            key={l.label}
            href={l.path}
            className={`bs-link ${isActive(l) ? "active" : ""}`}
            onClick={(event) => {
              event.preventDefault();
              go(l.path);
            }}
          >
            {l.label}
          </a>
        ))}
      </nav>
      <div className="bs-auth" style={{ alignItems: "center" }}>
        <button
          className="bs-btn-ghost"
          onClick={() => go("/profile")}
          title="View profile"
        >
          👤 {displayName}
        </button>
        <button className="bs-btn-ghost" onClick={handleLogout}>Logout</button>
      </div>
      <button className="bs-hamburger" type="button" aria-label="Toggle navigation" onClick={() => setMenuOpen((open) => !open)}><span /><span /><span /></button>
      {menuOpen && (
        <div style={{
          position: "absolute", top: "72px", left: 0, right: 0, background: "#0f0d0a",
          borderBottom: "1px solid rgba(255,255,255,0.08)", padding: 18, display: "grid", gap: 12,
        }}>
          {links.map((link) => (
            <button key={link.label} type="button" className="bs-btn-ghost" onClick={() => go(link.path)}>
              {link.label}
            </button>
          ))}
          <button type="button" className="bs-btn-orange" onClick={() => go("/profile")}>{displayName}</button>
          <button type="button" className="bs-btn-ghost" onClick={handleLogout}>Logout</button>
        </div>
      )}
    </motion.header>
  );
}
