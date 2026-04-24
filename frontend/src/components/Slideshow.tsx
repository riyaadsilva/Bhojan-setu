import { useEffect, useState } from "react";
import { SLIDESHOW_IMAGES } from "../data/ngos";

export default function Slideshow() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDESHOW_IMAGES.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <section style={{ padding: "6rem 2rem", background: "#0f0d0a" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", textAlign: "center" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.18em", color: "rgba(255, 255, 255, 0.9)", textTransform: "uppercase", fontWeight: 600 }}>
          Together We Made This Happen
        </span>
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(1.8rem, 3vw, 2.6rem)", color: "rgba(255, 255, 255, 0.95)", margin: "1rem 0 2rem", fontWeight: 700, lineHeight: 1.2 }}>
          Smiles We've Created
        </h2>
        <div style={{ position: "relative", width: "100%", height: 420, borderRadius: 20, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
          {SLIDESHOW_IMAGES.map((src, i) => (
            <img
              key={src}
              src={src}
              alt="Children & NGO volunteers"
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "cover",
                opacity: i === idx ? 1 : 0,
                transition: "opacity 1.2s ease-in-out",
              }}
            />
          ))}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 60%, rgba(15,13,10,0.7) 100%)" }} />
          <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, display: "flex", gap: 8, justifyContent: "center" }}>
            {SLIDESHOW_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                style={{
                  width: i === idx ? 28 : 8, height: 8, borderRadius: 4,
                  background: i === idx ? "#FF5722" : "rgba(255,255,255,0.4)",
                  border: "none", cursor: "pointer", transition: "all 0.3s",
                }}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
