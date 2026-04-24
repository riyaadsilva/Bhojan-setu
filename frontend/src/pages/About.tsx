import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import "./About.css";

const sectionVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

const sections = [
  {
    number: "01",
    tag: "The Problem",
    headline: "Tonnes of food discarded while millions go hungry",
    body: "Every day, vast quantities of prepared food go to waste at homes, restaurants, and events — while communities nearby face food insecurity. The disconnect between surplus and need is a solvable problem.",
    accent: "#c8441c",
  },
  {
    number: "02",
    tag: "Our Solution",
    headline: "A bridge between those who have and those who need",
    body: "BhojanSetu provides a simple platform to log surplus food, connect with local redistribution partners, and ensure meals reach people who need them — reducing waste and building community.",
    accent: "#c8a96e",
  },
  {
    number: "03",
    tag: "The Impact",
    headline: "Small actions compound into a movement",
    body: "When every household, restaurant, and caterer participates, the cumulative impact is transformative — fewer emissions from food waste, better nutrition for vulnerable groups, and a culture of mindful consumption.",
    accent: "#6b8f5e",
  },
  {
    number: "04",
    tag: "How It Works",
    headline: "Log. Match. Deliver. Repeat.",
    body: "You log what's left over. Our system finds the nearest partner who needs it. A volunteer or partner picks it up. The food reaches someone's plate instead of a landfill. Simple, fast, impactful.",
    accent: "#a989c8",
  },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="about-root">
      <div className="about-hero">
        <span className="about-label">About BhojanSetu</span>
        <h1 className="about-hero-title">
          Why food redistribution matters more than ever
        </h1>
        <div className="about-divider" />
      </div>

      <div className="about-sections">
        {sections.map((sec) => (
          <motion.div
            key={sec.number}
            className="about-section"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
          >
            <span className="about-number">{sec.number}</span>
            <div className="about-section-body">
              <span className="about-tag" style={{ borderColor: sec.accent, color: sec.accent }}>
                {sec.tag}
              </span>
              <h2 className="about-headline">{sec.headline}</h2>
              <p className="about-body">{sec.body}</p>
              <motion.div
                className="about-accent-line"
                style={{ background: sec.accent }}
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
              />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="about-cta">
        <h2 className="cta-title">Ready to make a difference?</h2>
        <p className="cta-sub">Start reducing food waste today</p>
        <p className="cta-sub">
          Join BhojanSetu and turn your leftover meals into someone else's hope.
        </p>
        <button className="cta-btn" onClick={() => navigate("/select-role")}>
          Get Started
        </button>
      </div>
    </div>
  );
}
