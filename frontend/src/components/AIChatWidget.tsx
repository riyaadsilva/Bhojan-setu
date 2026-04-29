import { useEffect, useRef, useState } from "react";
import { aiChat } from "../services/api";
import { useUser } from "../contexts/UserContext";

interface Message {
  role: "user" | "bot";
  text: string;
}

export default function AIChatWidget() {
  const { role } = useUser();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "bot", text: "👋 Hi! I'm SetuBot. Ask me anything about food donation, pickup, or NGO coordination." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);
    try {
      const result = await aiChat(text, role || "individual");
      setMessages((prev) => [...prev, { role: "bot", text: result.reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "Sorry, I couldn't connect to the AI right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <>
      {/* ── Scrollbar styles injected once ── */}
      <style>{`
        #bhojan-chat-messages::-webkit-scrollbar {
          width: 4px;
        }
        #bhojan-chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        #bhojan-chat-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 87, 34, 0.35);
          border-radius: 99px;
        }
        #bhojan-chat-messages::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 87, 34, 0.6);
        }
        #ai-chat-widget-toggle:hover {
          transform: scale(1.1) !important;
          box-shadow: 0 6px 32px rgba(255, 87, 34, 0.65) !important;
        }
        #ai-chat-send:hover:not(:disabled) {
          background: #e64a19 !important;
        }
      `}</style>

      {/* ── Floating trigger button ── */}
      <button
        id="ai-chat-widget-toggle"
        aria-label="Open BhojanBot chat"
        onClick={() => setOpen((v) => !v)}
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          zIndex: 9999,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #FF5722 0%, #ff8a65 100%)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 24px rgba(255, 87, 34, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.7rem",
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          transform: open ? "rotate(45deg)" : "rotate(0deg)",
        }}
      >
        {open ? "✕" : "🤖"}
      </button>

      {/* ── Chat panel ── */}
      {open && (
        <div
          id="ai-chat-widget-panel"
          style={{
            position: "fixed",
            bottom: 104,
            right: 32,
            zIndex: 9998,
            /* Desktop: 420px | Mobile: 92vw */
            width: "min(420px, 92vw)",
            height: "clamp(480px, 600px, 90vh)",
            background: "#141210",
            border: "1px solid rgba(255, 87, 34, 0.22)",
            borderRadius: 20,
            boxShadow: "0 12px 56px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255,255,255,0.04)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              padding: "16px 20px",
              background: "rgba(255, 87, 34, 0.10)",
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #FF5722, #ff8a65)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.3rem",
                flexShrink: 0,
              }}
            >
              🤖
            </div>
            <div>
              <div style={{ fontWeight: 700, color: "#ffffff", fontSize: "1rem", lineHeight: 1.2 }}>
                SetuBot
              </div>
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.75rem", marginTop: 2 }}>
                Smart Food Rescue Assistant
              </div>
            </div>
            {/* Live indicator */}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: "#4ade80",
                  display: "inline-block",
                  boxShadow: "0 0 6px #4ade80",
                }}
              />
              <span style={{ color: "#4ade80", fontSize: "0.72rem", fontWeight: 600 }}>Online</span>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />

          {/* ── Messages ── */}
          <div
            id="bhojan-chat-messages"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "20px 18px 12px",
              display: "flex",
              flexDirection: "column",
              gap: 14,
              scrollBehavior: "smooth",
            }}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: m.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    background:
                      m.role === "user"
                        ? "linear-gradient(135deg, #FF5722, #ff7043)"
                        : "rgba(255,255,255,0.07)",
                    color: "rgba(255,255,255,0.95)",
                    padding: "10px 14px",
                    borderRadius:
                      m.role === "user"
                        ? "18px 18px 4px 18px"
                        : "18px 18px 18px 4px",
                    maxWidth: "75%",
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    boxShadow:
                      m.role === "user"
                        ? "0 2px 12px rgba(255,87,34,0.3)"
                        : "none",
                    border: m.role === "bot" ? "1px solid rgba(255,255,255,0.07)" : "none",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <div
                  style={{
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    padding: "10px 16px",
                    borderRadius: "18px 18px 18px 4px",
                    color: "rgba(255,255,255,0.4)",
                    fontSize: "0.85rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  ● ● ●
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", flexShrink: 0 }} />

          {/* ── Input area ── */}
          <div
            style={{
              padding: "14px 16px",
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexShrink: 0,
              background: "#141210",
            }}
          >
            <input
              id="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about donations, NGOs…"
              disabled={loading}
              autoComplete="off"
              style={{
                flex: 1,
                height: 44,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.11)",
                borderRadius: 12,
                padding: "0 14px",
                color: "rgba(255,255,255,0.92)",
                fontSize: "0.9rem",
                outline: "none",
                fontFamily: "inherit",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,87,34,0.5)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.11)")}
            />
            <button
              id="ai-chat-send"
              onClick={send}
              disabled={loading || !input.trim()}
              style={{
                height: 44,
                padding: "0 18px",
                background: "#FF5722",
                border: "none",
                borderRadius: 12,
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.88rem",
                fontFamily: "inherit",
                opacity: loading || !input.trim() ? 0.5 : 1,
                transition: "background 0.18s, opacity 0.18s",
                flexShrink: 0,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
}
