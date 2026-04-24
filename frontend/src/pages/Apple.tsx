import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./Apple.css";
import appleVideo from "../assets/apple-video.mp4";

export default function Apple() {
  const navigate = useNavigate();

  return (
    <div className="apple-root">
      <div className="apple-glow" />

      <motion.span
        className="apple-eyebrow"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        The journey begins with one bite
      </motion.span>

      <motion.div
        className="apple-video-wrap"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <video className="apple-video" autoPlay loop muted playsInline>
          <source src={appleVideo} type="video/mp4" />
        </video>
        <div className="apple-vignette" />
      </motion.div>

      <div className="apple-shadow" />

      <div className="apple-bottom">
        <motion.p
          className="apple-subtitle"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.8 }}
        >
          Every Meal has a story. Every meal, is a purpose.
        </motion.p>

        <button className="apple-btn" onClick={() => navigate("/about")}>
          Discover More ↓
        </button>
      </div>
    </div>
  );
}
