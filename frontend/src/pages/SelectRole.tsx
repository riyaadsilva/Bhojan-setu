import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./SelectRole.css";

const roles = [
  {
    key: "individual",
    icon: "🏠",
    iconClass: "sr-icon-individual",
    title: "Individual",
    desc: "Share your leftover home-cooked meals with those who need them.",
  },
  {
    key: "restaurant",
    icon: "🍽️",
    iconClass: "sr-icon-restaurant",
    title: "Restaurant / Caterer",
    desc: "Reduce waste, optimize production, and donate surplus food.",
  },
  {
    key: "ngo",
    icon: "🤝",
    iconClass: "sr-icon-ngo",
    title: "NGO",
    desc: "Connect with food donors and distribute meals to communities.",
  },
];

export default function SelectRole() {
  const navigate = useNavigate();

  return (
    <div className="sr-root">
      <div className="sr-blob sr-blob-1" />
      <div className="sr-blob sr-blob-2" />

      <motion.h1
        className="sr-heading"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Before we start…
      </motion.h1>
      <motion.p
        className="sr-sub"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        Who are you?
      </motion.p>

      <div className="sr-cards">
        {roles.map((r, i) => (
          <motion.button
            type="button"
            key={r.key}
            className="sr-card"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 + i * 0.15 }}
            onClick={() => navigate(`/login?role=${r.key}`)}
          >
            <div className={`sr-icon ${r.iconClass}`}>{r.icon}</div>
            <h2 className="sr-card-title">{r.title}</h2>
            <p className="sr-card-desc">{r.desc}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
