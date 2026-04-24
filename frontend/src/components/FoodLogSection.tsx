import { useEffect, useState } from "react";
import { toast } from "sonner";
import { createFoodLog, deleteFoodLog, fetchFoodLogs } from "../services/api";

interface FoodLog {
  id?: string;
  _id?: string;
  food_name: string;
  food_prepared: number;
  food_consumed: number;
  food_leftover: number;
  donatedQuantity?: number;
  wastedQuantity?: number;
  foodCategory?: string;
  logDate?: string;
  created_at?: string;
  createdAt?: string;
}

export default function FoodLogSection() {
  const [foodName, setFoodName] = useState("");
  const [prepared, setPrepared] = useState("");
  const [consumed, setConsumed] = useState("");
  const [leftover, setLeftover] = useState("");
  const [donated, setDonated] = useState("");
  const [foodCategory, setFoodCategory] = useState("normal");
  const [logDate, setLogDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [logs, setLogs] = useState<FoodLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    void loadLogs();
  }, []);

  async function loadLogs() {
    setFetching(true);
    try {
      setLogs(await fetchFoodLogs());
    } catch (err: any) {
      toast.error("Could not fetch logs: " + err.message);
    } finally {
      setFetching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const preparedNumber = Number(prepared);
    const consumedNumber = Number(consumed);
    const leftoverNumber = Number(leftover);
    const donatedNumber = donated ? Number(donated) : 0;

    if (
      !foodName.trim() ||
      !Number.isFinite(preparedNumber) ||
      !Number.isFinite(consumedNumber) ||
      !Number.isFinite(leftoverNumber) ||
      !Number.isFinite(donatedNumber)
    ) {
      toast.error("Please enter a food name and valid numeric quantities.");
      return;
    }

    setLoading(true);
    try {
      await createFoodLog({
        food_name: foodName.trim(),
        food_prepared: preparedNumber,
        food_consumed: consumedNumber,
        food_leftover: leftoverNumber,
        preparedQuantity: preparedNumber,
        consumedQuantity: consumedNumber,
        donatedQuantity: donatedNumber,
        foodCategory,
        logDate,
        donorType: "restaurant",
      });
      setFoodName("");
      setPrepared("");
      setConsumed("");
      setLeftover("");
      setDonated("");
      setFoodCategory("normal");
      setLogDate(new Date().toISOString().slice(0, 10));
      toast.success("Food log saved successfully.");
      await loadLogs();
    } catch (err: any) {
      toast.error("Could not save log: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id?: string) {
    if (!id) return;
    try {
      await deleteFoodLog(id);
      setLogs((items) => items.filter((item) => item.id !== id && item._id !== id));
      toast.success("Log deleted successfully.");
    } catch (err: any) {
      toast.error("Could not delete log: " + err.message);
    }
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  }

  return (
    <div className="bs-food-log-section">
      <div className="bs-section-inner">
        <span className="bs-section-label">Daily Tracking</span>
        <h2 className="bs-hiw-title" style={{ marginBottom: 32 }}>Log Today's Food</h2>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
          <div className="login-field">
            <label className="login-label">Food Item Name</label>
            <input className="login-input" value={foodName} onChange={(e) => setFoodName(e.target.value)} placeholder="e.g. Dal, Rice, Roti" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <div className="login-field">
              <label className="login-label">Food Prepared (kg/units)</label>
              <input className="login-input" type="number" step="0.1" min="0" value={prepared} onChange={(e) => setPrepared(e.target.value)} placeholder="0" />
            </div>
            <div className="login-field">
              <label className="login-label">Food Consumed (kg/units)</label>
              <input className="login-input" type="number" step="0.1" min="0" value={consumed} onChange={(e) => setConsumed(e.target.value)} placeholder="0" />
            </div>
            <div className="login-field">
              <label className="login-label">Food Leftover (kg/units)</label>
              <input className="login-input" type="number" step="0.1" min="0" value={leftover} onChange={(e) => setLeftover(e.target.value)} placeholder="0" />
            </div>
            <div className="login-field">
              <label className="login-label">Food Donated (kg/units)</label>
              <input className="login-input" type="number" step="0.1" min="0" value={donated} onChange={(e) => setDonated(e.target.value)} placeholder="0" />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
            <div className="login-field">
              <label className="login-label">Food Category</label>
              <select className="login-input" value={foodCategory} onChange={(e) => setFoodCategory(e.target.value)}>
                <option value="healthy">Healthy</option>
                <option value="normal">Normal</option>
                <option value="junk">Junk</option>
              </select>
            </div>
            <div className="login-field">
              <label className="login-label">Log Date</label>
              <input className="login-input" type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="login-submit" disabled={loading} style={{ maxWidth: 280 }}>
            {loading ? "Saving..." : "Submit Food Log"}
          </button>
        </form>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.25rem", fontWeight: 600, color: "rgba(255, 255, 255, 0.95)", margin: 0, lineHeight: 1.4 }}>Food Log History</h3>
          <button type="button" className="bs-btn-ghost" onClick={loadLogs}>Refresh</button>
        </div>

        {fetching ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", width: "100%", marginTop: "1rem" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "8px", animation: "pulse 1.5s infinite ease-in-out" }}></div>
            ))}
            <style>{`
              @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 0.3; }
                100% { opacity: 0.6; }
              }
            `}</style>
          </div>
        ) : logs.length === 0 ? (
          <p style={{ color: "rgba(255, 255, 255, 0.78)", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem", lineHeight: 1.65 }}>No food logs yet. Start by adding one above.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'DM Sans', sans-serif", fontSize: "1rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  {["Food Item", "Prepared", "Consumed", "Leftover", "Donated", "Wasted", "Category", "Logged At", "Action"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "1rem 0.5rem", color: "rgba(255, 255, 255, 0.72)", fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, index) => {
                  const id = log.id || log._id;
                  return (
                    <tr key={id || index} style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "1rem 0.5rem", color: "rgba(255, 255, 255, 0.95)" }}>{log.food_name}</td>
                      <td style={{ padding: "1rem 0.5rem", color: "rgba(255, 255, 255, 0.95)" }}>{log.food_prepared}</td>
                      <td style={{ padding: "1rem 0.5rem", color: "rgba(255, 255, 255, 0.95)" }}>{log.food_consumed}</td>
                      <td style={{ padding: "1rem 0.5rem", color: log.food_leftover > 0 ? "#FF5722" : "#6b8f5e" }}>{log.food_leftover}</td>
                      <td style={{ padding: "1rem 0.5rem", color: "#4ade80" }}>{log.donatedQuantity ?? 0}</td>
                      <td style={{ padding: "1rem 0.5rem", color: "#FF5722" }}>{log.wastedQuantity ?? Math.max(log.food_prepared - log.food_consumed - (log.donatedQuantity ?? 0), 0)}</td>
                      <td style={{ padding: "1rem 0.5rem", color: "rgba(255, 255, 255, 0.95)", textTransform: "capitalize" }}>{log.foodCategory || "normal"}</td>
                      <td style={{ padding: "1rem 0.5rem", color: "rgba(255, 255, 255, 0.78)" }}>{formatDate(log.logDate || log.created_at || log.createdAt)}</td>
                      <td style={{ padding: "1rem 0.5rem" }}>
                        <button type="button" className="bs-btn-ghost" disabled={!id} onClick={() => handleDelete(id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
