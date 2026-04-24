import { useEffect, useState } from "react";
import AppNav from "../components/AppNav";
import { IMPACT_STORIES } from "../data/ngos";
import { fetchImpactStories } from "../services/api";

export default function ImpactStories() {
  const [stories, setStories] = useState(IMPACT_STORIES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchImpactStories()
      .then((data) => {
        if (!cancelled && data?.length) {
          setStories(data.map((story: any, index: number) => ({
            id: story.id || story._id || `story-${index}`,
            title: story.title,
            body: story.body,
            date: story.date || story.storyDate || "Recently",
            image: story.image,
            source: story.source || "BhojanSetu Network",
          })));
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Using sample stories.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bs-root">
      <AppNav active="Impact Stories" />

      <div style={{ paddingTop: 110, padding: "110px 2rem 6rem", maxWidth: 1100, margin: "0 auto" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.18em", color: "rgba(255, 255, 255, 0.9)", textTransform: "uppercase", fontWeight: 600 }}>
          Real Stories. Real Change.
        </span>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2.4rem, 4vw, 4rem)", color: "rgba(255, 255, 255, 0.95)", margin: "1rem 0 0.5rem", fontWeight: 700, lineHeight: 1.2 }}>
          Impact Stories & News
        </h1>
        <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", marginBottom: 36, fontSize: "1rem", lineHeight: 1.65 }}>
          Every meal donated becomes a story of hope. Here are some of them.
        </p>
        {loading && <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>Loading latest stories...</p>}
        {error && <p style={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>{error}</p>}

        <div style={{ display: "grid", gap: 28 }}>
          {stories.map((s, i) => (
            <article key={s.id} style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20, overflow: "hidden",
              display: "grid", gridTemplateColumns: i % 2 === 0 ? "minmax(0, 1fr) 1.2fr" : "1.2fr minmax(0, 1fr)",
            }}>
              <img src={s.image} alt={s.title} style={{
                width: "100%", height: "100%", minHeight: 240, objectFit: "cover",
                gridColumn: i % 2 === 0 ? 1 : 2, gridRow: 1,
              }} />
              <div style={{ padding: "2rem", gridColumn: i % 2 === 0 ? 2 : 1, gridRow: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", letterSpacing: "0.18em", color: "rgba(255, 255, 255, 0.9)", textTransform: "uppercase", fontWeight: 600 }}>{s.source}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", color: "rgba(255, 255, 255, 0.78)" }}>{s.date}</span>
                </div>
                <h2 style={{ fontFamily: "'Playfair Display', serif", color: "rgba(255, 255, 255, 0.95)", fontSize: "1.25rem", margin: "0 0 14px", fontWeight: 600, lineHeight: 1.4 }}>{s.title}</h2>
                <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65, margin: 0 }}>{s.body}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
