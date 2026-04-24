import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useUser } from "../contexts/UserContext";
import {
  fetchIndividualWasteAnalytics,
  fetchWasteAnalyticsDaily,
  fetchWasteAnalyticsMonthly,
  fetchWasteAnalyticsWeekly,
} from "../services/api";

const cardStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  padding: "2rem",
};

const restaurantFallback = {
  daily: {
    period: "daily",
    summary: { totalPrepared: 88, totalConsumed: 69, totalLeftover: 19, totalDonated: 14, totalWasted: 5, potentialWaste: 7, wastePercentage: 5.7, donationEfficiency: 73.7 },
    trends: [
      { label: "Mon", prepared: 84, donated: 11, wasted: 8 },
      { label: "Tue", prepared: 88, donated: 13, wasted: 6 },
      { label: "Wed", prepared: 82, donated: 10, wasted: 7 },
      { label: "Thu", prepared: 91, donated: 15, wasted: 5 },
      { label: "Fri", prepared: 95, donated: 17, wasted: 6 },
      { label: "Sat", prepared: 102, donated: 18, wasted: 9 },
      { label: "Sun", prepared: 88, donated: 14, wasted: 5 },
    ],
    donatedVsWasted: [{ name: "Donated", value: 14 }, { name: "Wasted", value: 5 }],
    categoryWaste: [
      { category: "healthy", prepared: 32, donated: 8, wasted: 2 },
      { category: "normal", prepared: 40, donated: 5, wasted: 2 },
      { category: "junk", prepared: 16, donated: 1, wasted: 1 },
    ],
    alerts: ["Good rescue efficiency. Most leftover food was redirected successfully."],
  },
  weekly: {
    period: "weekly",
    summary: { totalPrepared: 630, totalConsumed: 492, totalLeftover: 138, totalDonated: 101, totalWasted: 37, potentialWaste: 22, wastePercentage: 5.9, donationEfficiency: 73.2 },
    trends: [
      { label: "W1", prepared: 590, donated: 88, wasted: 31 },
      { label: "W2", prepared: 608, donated: 91, wasted: 35 },
      { label: "W3", prepared: 615, donated: 95, wasted: 33 },
      { label: "W4", prepared: 630, donated: 101, wasted: 37 },
    ],
    donatedVsWasted: [{ name: "Donated", value: 101 }, { name: "Wasted", value: 37 }],
    categoryWaste: [
      { category: "healthy", donated: 34, wasted: 9 },
      { category: "normal", donated: 46, wasted: 18 },
      { category: "junk", donated: 21, wasted: 10 },
    ],
    alerts: ["Good rescue efficiency. Most leftover food was redirected successfully."],
  },
  monthly: {
    period: "monthly",
    summary: { totalPrepared: 2640, totalConsumed: 2084, totalLeftover: 556, totalDonated: 394, totalWasted: 162, potentialWaste: 43, wastePercentage: 6.1, donationEfficiency: 70.9 },
    trends: [
      { label: "Nov", prepared: 2410, donated: 350, wasted: 151 },
      { label: "Dec", prepared: 2488, donated: 362, wasted: 149 },
      { label: "Jan", prepared: 2514, donated: 370, wasted: 155 },
      { label: "Feb", prepared: 2560, donated: 382, wasted: 160 },
      { label: "Mar", prepared: 2608, donated: 388, wasted: 158 },
      { label: "Apr", prepared: 2640, donated: 394, wasted: 162 },
    ],
    donatedVsWasted: [{ name: "Donated", value: 394 }, { name: "Wasted", value: 162 }],
    categoryWaste: [
      { category: "healthy", donated: 140, wasted: 36 },
      { category: "normal", donated: 176, wasted: 82 },
      { category: "junk", donated: 78, wasted: 44 },
    ],
    alerts: ["Good rescue efficiency. Most leftover food was redirected successfully."],
  },
};

const individualFallback = {
  period: "individual",
  summary: {
    totalDonationsMade: 12,
    totalPrepared: 0,
    totalDonated: 94,
    totalWasted: 21,
    totalQuantityDonated: 94,
    completedQuantity: 73,
    potentialWaste: 21,
    pendingOrIncompleteCount: 4,
    wastePercentage: 22.3,
    donationEfficiency: 77.7,
  },
  trends: [
    { label: "Nov", donated: 11, wasted: 3 },
    { label: "Dec", donated: 14, wasted: 2 },
    { label: "Jan", donated: 15, wasted: 4 },
    { label: "Feb", donated: 16, wasted: 3 },
    { label: "Mar", donated: 18, wasted: 4 },
    { label: "Apr", donated: 20, wasted: 5 },
  ],
  donatedVsWasted: [{ name: "Completed", value: 73 }, { name: "Potential Waste", value: 21 }],
  categoryWaste: [
    { category: "healthy", donated: 28, wasted: 4 },
    { category: "normal", donated: 46, wasted: 10 },
    { category: "junk", donated: 20, wasted: 7 },
  ],
  alerts: [
    "High food wastage detected today. Consider reducing preparation quantity.",
    "Good rescue efficiency. Most leftover food was redirected successfully.",
  ],
};

const periodLabels = {
  daily: "Today",
  weekly: "This Week",
  monthly: "This Month",
} as const;

type Period = "daily" | "weekly" | "monthly";

const formatMetric = (value?: number) => `${(value || 0).toFixed(1)} kg`;

export default function AnalyticsChart() {
  const { role } = useUser();
  const [period, setPeriod] = useState<Period>("weekly");
  const [analytics, setAnalytics] = useState<any>(role === "individual" ? individualFallback : restaurantFallback.weekly);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const data =
          role === "individual"
            ? await fetchIndividualWasteAnalytics()
            : period === "daily"
              ? await fetchWasteAnalyticsDaily()
              : period === "monthly"
                ? await fetchWasteAnalyticsMonthly()
                : await fetchWasteAnalyticsWeekly();

        if (!cancelled) {
          setAnalytics(data);
          setError("");
        }
      } catch (err: any) {
        if (!cancelled) {
          setAnalytics(role === "individual" ? individualFallback : restaurantFallback[period]);
          setError(err.message || "Using sample analytics data until the backend is available.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [period, role]);

  const summaryCards = useMemo(() => {
    const summary = analytics?.summary || {};

    if (role === "individual") {
      return [
        { label: "Total Donations", value: summary.totalDonationsMade || 0, suffix: "" },
        { label: "Total Donated", value: summary.totalDonated || summary.totalQuantityDonated || 0, suffix: " kg" },
        { label: "Potential Waste", value: summary.potentialWaste || 0, suffix: " kg" },
        { label: "Waste Percentage", value: summary.wastePercentage || 0, suffix: "%" },
        { label: "Donation Efficiency", value: summary.donationEfficiency || 0, suffix: "%" },
        { label: "Incomplete Donations", value: summary.pendingOrIncompleteCount || 0, suffix: "" },
      ];
    }

    return [
      { label: "Total Prepared", value: summary.totalPrepared || 0, suffix: " kg" },
      { label: "Total Donated", value: summary.totalDonated || 0, suffix: " kg" },
      { label: "Total Wasted", value: summary.totalWasted || 0, suffix: " kg" },
      { label: "Waste Percentage", value: summary.wastePercentage || 0, suffix: "%" },
      { label: "Donation Efficiency", value: summary.donationEfficiency || 0, suffix: "%" },
      { label: "Potential Waste", value: summary.potentialWaste || 0, suffix: " kg" },
    ];
  }, [analytics, role]);

  const trendData = useMemo(
    () =>
      (analytics?.trends || []).map((item: any) => ({
        label: item.label,
        donated: item.donated || 0,
        wasted: item.wasted || 0,
        prepared: item.prepared || 0,
      })),
    [analytics]
  );

  const categoryData = useMemo(
    () =>
      (analytics?.categoryWaste || []).map((item: any) => ({
        category: item.category,
        donated: item.donated || 0,
        wasted: item.wasted || 0,
      })),
    [analytics]
  );

  const compareData = analytics?.donatedVsWasted || [];
  const alerts = analytics?.alerts || [];
  const heading = role === "individual" ? "Donation Outcome Analytics" : "Food Waste Analysis";
  const subheading = role === "individual" ? "Donation rescue status and potential waste across your posts." : `${periodLabels[period]} waste, donation, and rescue efficiency.`;

  return (
    <div className="bs-analytics-section">
      <div className="bs-section-inner">
        <span className="bs-section-label">{role === "individual" ? "Personal Overview" : "Waste Intelligence"}</span>
        <h2 className="bs-hiw-title" style={{ marginBottom: 10 }}>{heading}</h2>
        <p style={{ color: "#a89b85", fontFamily: "'DM Sans', sans-serif", marginTop: 0, marginBottom: 22 }}>{subheading}</p>
        {error && <p style={{ color: "#ffb86b", fontFamily: "'DM Sans', sans-serif", marginBottom: 18 }}>{error}</p>}

        {role === "restaurant" && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 22 }}>
            {(["daily", "weekly", "monthly"] as Period[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                style={{
                  background: period === option ? "#FF5722" : "transparent",
                  color: period === option ? "#fff" : "rgba(255, 255, 255, 0.72)",
                  border: `1px solid ${period === option ? "#FF5722" : "rgba(255,255,255,0.12)"}`,
                  padding: "0.5rem 1rem",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "1rem",
                  textTransform: "capitalize",
                }}
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {alerts.length > 0 && (
          <div style={{ display: "grid", gap: 10, marginBottom: 22 }}>
            {alerts.map((alert: string) => (
              <div
                key={alert}
                style={{
                  background: "rgba(255,87,34,0.08)",
                  border: "1px solid rgba(255,87,34,0.22)",
                  borderRadius: 12,
                  padding: "1rem",
                  color: "rgba(255, 255, 255, 0.95)",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "1rem",
                  lineHeight: 1.65,
                }}
              >
                {alert}
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 28 }}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} style={{ ...cardStyle, height: "120px", background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s infinite ease-in-out" }}></div>
            ))}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 16, marginBottom: 28 }}>
            {summaryCards.map((card) => (
              <div key={card.label} style={cardStyle}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.72)", marginBottom: 6, fontWeight: 500 }}>{card.label}</div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 2.5vw, 2.8rem)", fontWeight: 700, color: "rgba(255, 255, 255, 0.95)", lineHeight: 1.1 }}>
                  {typeof card.value === "number" ? card.value.toFixed(card.suffix === "" ? 0 : 1) : card.value}
                  {card.suffix}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "grid", gap: 20 }}>
          <div style={{ ...cardStyle, padding: "2rem" }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.72)", marginBottom: 16, fontWeight: 500 }}>
              {role === "individual" ? "Donation vs potential waste trend" : "Daily waste trend"}
            </div>
            {loading ? (
              <div style={{ width: "100%", height: "320px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", animation: "pulse 1.5s infinite ease-in-out" }}></div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="label" stroke="#8a7e6e" fontSize={14} />
                  <YAxis stroke="#8a7e6e" fontSize={14} />
                  <Tooltip
                    contentStyle={{ background: "#1a1714", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "1rem" }}
                    formatter={(value: number) => formatMetric(value)}
                    labelStyle={{ color: "rgba(255, 255, 255, 0.95)" }}
                  />
                  <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem" }} />
                  {role === "restaurant" && <Line type="monotone" dataKey="prepared" stroke="#c8a96e" strokeWidth={2.2} name="Prepared" dot={{ r: 3 }} />}
                  <Line type="monotone" dataKey="donated" stroke="#4ade80" strokeWidth={2.5} name="Donated" dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="wasted" stroke="#FF5722" strokeWidth={2.5} name={role === "individual" ? "Potential Waste" : "Wasted"} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20 }}>
            <div style={{ ...cardStyle, padding: "2rem" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.72)", marginBottom: 16, fontWeight: 500 }}>
                {role === "individual" ? "Completed vs potential waste" : "Donated vs wasted food"}
              </div>
              {loading ? (
                <div style={{ width: "100%", height: "280px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", animation: "pulse 1.5s infinite ease-in-out" }}></div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                <BarChart data={compareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#8a7e6e" fontSize={14} />
                  <YAxis stroke="#8a7e6e" fontSize={14} />
                  <Tooltip
                    contentStyle={{ background: "#1a1714", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "1rem" }}
                    formatter={(value: number) => formatMetric(value)}
                  />
                  <Bar dataKey="value" fill="#FF5722" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>

            <div style={{ ...cardStyle, padding: "2rem" }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", color: "rgba(255, 255, 255, 0.72)", marginBottom: 16, fontWeight: 500 }}>
                {role === "individual" ? "Category-wise potential waste" : "Food category-wise waste"}
              </div>
              {loading ? (
                <div style={{ width: "100%", height: "280px", background: "rgba(255,255,255,0.05)", borderRadius: "10px", animation: "pulse 1.5s infinite ease-in-out" }}></div>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="category" stroke="#8a7e6e" fontSize={14} />
                  <YAxis stroke="#8a7e6e" fontSize={14} />
                  <Tooltip
                    contentStyle={{ background: "#1a1714", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: "1rem" }}
                    formatter={(value: number) => formatMetric(value)}
                  />
                  <Legend wrapperStyle={{ fontFamily: "'DM Sans', sans-serif", fontSize: "1rem" }} />
                  <Bar dataKey="donated" fill="#4ade80" radius={[6, 6, 0, 0]} name="Donated" />
                  <Bar dataKey="wasted" fill="#FF5722" radius={[6, 6, 0, 0]} name={role === "individual" ? "Potential Waste" : "Wasted"} />
                </BarChart>
              </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
