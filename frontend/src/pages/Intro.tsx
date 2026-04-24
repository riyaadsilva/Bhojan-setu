import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./Intro.css";

export default function Intro() {
  const navigate = useNavigate();

  return (
    <div className="intro-root">
      <div className="intro-blob intro-blob-1" />
      <div className="intro-blob intro-blob-2" />
      <div className="intro-blob intro-blob-3" />

      <div className="intro-center">
        <motion.div
          className="intro-logo-wrap"
          initial={{ opacity: 0, scale: 0.75 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="intro-logo-circle">
            <span className="intro-logo-letter">भ</span>
          </div>
        </motion.div>

        <motion.h1
          className="intro-title"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          BhojanSetu
        </motion.h1>

        <motion.p
          className="intro-tagline"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.85, ease: [0.16, 1, 0.3, 1] }}
        >
          Bridging surplus to sustenance —<br />one meal at a time.
        </motion.p>

        <motion.button
          className="intro-btn"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.4 }}
          onClick={() => navigate("/experience")}
        >
          Enter Experience
          <span className="intro-btn-arrow">→</span>
        </motion.button>
      </div>
    </div>
  );
}
