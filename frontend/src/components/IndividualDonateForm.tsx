import { useState } from "react";
import { useUser } from "../contexts/UserContext";
import DonationLocationPicker, { PickupLocation } from "./DonationLocationPicker";
import { createDonationPost, aiValidateImage, aiSuggestCategory } from "../services/api";

// ─── Shared style tokens ──────────────────────────────────────────────────────

const card = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 20,
  padding: "2rem",
} as const;

const label = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.95rem",
  color: "rgba(255,255,255,0.72)",
  marginBottom: 6,
  display: "block",
  fontWeight: 500,
} as const;

const inputStyle = {
  width: "100%",
  backgroundColor: "#0f0d0a",
  border: "1px solid rgba(255,255,255,0.12)",
  color: "rgba(255,255,255,0.95)",
  padding: "1rem",
  borderRadius: 10,
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "1rem",
  outline: "none",
  boxSizing: "border-box",
} as const;

const sectionTitle = {
  fontFamily: "'DM Sans', sans-serif",
  fontSize: "0.75rem",
  letterSpacing: "0.16em",
  color: "rgba(255,255,255,0.4)",
  textTransform: "uppercase" as const,
  fontWeight: 600,
  marginBottom: 14,
  marginTop: 6,
  paddingTop: 18,
  borderTop: "1px solid rgba(255,255,255,0.06)",
};

const ALLERGEN_OPTIONS = ["nuts", "dairy", "gluten", "soy", "eggs", "seafood", "others"];
const FOOD_CATEGORY_OPTIONS = ["protein", "grains", "fruits", "vegetables", "dairy"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function IndividualDonateForm() {
  const { profile, role, addDonation } = useUser();

  // Core fields (existing)
  const [form, setForm] = useState({
    totalPrepared: "",
    remaining: "",
    category: "normal" as "junk" | "normal" | "healthy",
    description: "",
  });

  // New: Food prep details
  const [preparedDate, setPreparedDate] = useState("");
  const [preparedTime, setPreparedTime] = useState("");
  const [bestBeforeDate, setBestBeforeDate] = useState("");
  const [bestBeforeTime, setBestBeforeTime] = useState("");
  const [storageCondition, setStorageCondition] = useState<"room_temp" | "refrigerated" | "frozen" | "">("");

  // New: Ingredients & allergens
  const [ingredients, setIngredients] = useState("");
  const [allergens, setAllergens] = useState<string[]>([]);

  // New: Food classification
  const [foodType, setFoodType] = useState<"veg" | "non-veg" | "vegan" | "unknown" | "">("");
  const [foodCategories, setFoodCategories] = useState<string[]>([]);

  // Existing photo + location
  const [pickupLocation, setPickupLocation] = useState<PickupLocation>({});
  const [photo, setPhoto] = useState<string | undefined>();

  // UI state
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageWarning, setImageWarning] = useState("");
  const [imageSuccess, setImageSuccess] = useState("");
  const [isValidatingImage, setIsValidatingImage] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    foodType?: string;
    allergens?: string[];
    reasoning?: string;
  } | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [bestBeforeWarning, setBestBeforeWarning] = useState("");

  // ── Helpers ────────────────────────────────────────────────────────────────

  const toggleChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const chipStyle = (active: boolean, accent = "#FF5722") => ({
    padding: "6px 14px",
    borderRadius: 99,
    border: `1px solid ${active ? accent : "rgba(255,255,255,0.15)"}`,
    background: active ? `${accent}22` : "transparent",
    color: active ? accent : "rgba(255,255,255,0.65)",
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: "0.84rem",
    fontWeight: 500,
    transition: "all 0.15s",
  } as const);

  // ── File handler ──────────────────────────────────────────────────────────

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) {
      setError("Photo must be smaller than 10 MB.");
      return;
    }
    setError("");
    setImageWarning("");
    setImageSuccess("");
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(f);
  };

  // ── AI: validate image ────────────────────────────────────────────────────

  const handleValidateImage = async () => {
    if (!photo) return;
    setIsValidatingImage(true);
    setImageWarning("");
    setImageSuccess("");
    try {
      const result = await aiValidateImage(photo);
      if (result.validFood || result.skipped) {
        setImageSuccess("✅ Food image validated successfully.");
      } else if (result.loading) {
        setImageWarning("AI model is warming up — image accepted without validation.");
      } else {
        setImageWarning(
          `This image may not contain food. Please upload a clearer food image. (${result.confidence}% confidence)`
        );
      }
    } catch {
      setImageWarning("Could not validate image right now. You can still continue.");
    } finally {
      setIsValidatingImage(false);
    }
  };

  // ── AI: suggest category & auto-fill ─────────────────────────────────────

  // Mapping from common food terms → allowed chip values
  const CATEGORY_KEYWORD_MAP: Record<string, string> = {
    rice: "grains", bread: "grains", roti: "grains", chapati: "grains", naan: "grains",
    noodle: "grains", noodles: "grains", pasta: "grains", wheat: "grains", oats: "grains",
    cereal: "grains", grains: "grains",
    dal: "protein", lentil: "protein", lentils: "protein", chicken: "protein",
    fish: "protein", egg: "protein", eggs: "protein", paneer: "protein", meat: "protein",
    mutton: "protein", prawn: "protein", prawns: "protein", tofu: "protein",
    soy: "protein", beans: "protein", protein: "protein",
    milk: "dairy", cheese: "dairy", curd: "dairy", raita: "dairy", yogurt: "dairy",
    butter: "dairy", ghee: "dairy", cream: "dairy", dairy: "dairy",
    sabzi: "vegetables", salad: "vegetables", vegetable: "vegetables", vegetables: "vegetables",
    potato: "vegetables", onion: "vegetables", tomato: "vegetables",
    fruit: "fruits", fruits: "fruits", mango: "fruits", banana: "fruits", apple: "fruits",
  };

  const mapToAllowedCategories = (rawCategories: string[]): string[] => {
    const mapped = new Set<string>();
    for (const raw of rawCategories) {
      const lower = raw.toLowerCase().trim();
      // Direct match to allowed values
      if (FOOD_CATEGORY_OPTIONS.includes(lower)) {
        mapped.add(lower);
        continue;
      }
      // Keyword map lookup
      if (CATEGORY_KEYWORD_MAP[lower]) {
        mapped.add(CATEGORY_KEYWORD_MAP[lower]);
        continue;
      }
      // Partial match — check if the raw string contains any keyword
      for (const [keyword, category] of Object.entries(CATEGORY_KEYWORD_MAP)) {
        if (lower.includes(keyword)) {
          mapped.add(category);
          break;
        }
      }
    }
    return [...mapped];
  };

  const handleAiSuggest = async () => {
    const desc = form.description.trim();
    if (!desc) return;
    setIsSuggesting(true);
    setAiSuggestion(null);
    try {
      const result = await aiSuggestCategory(desc);
      console.log("AI autofill result:", result);
      setAiSuggestion(result);

      // Auto-fill healthCategory → form.category
      if (result.healthCategory && ["healthy", "normal", "junk"].includes(result.healthCategory)) {
        setForm((prev) => ({ ...prev, category: result.healthCategory as "healthy" | "normal" | "junk" }));
      }
      // Auto-fill foodType
      if (result.foodType && ["veg", "non-veg", "vegan", "unknown"].includes(result.foodType)) {
        setFoodType(result.foodType as "veg" | "non-veg" | "vegan" | "unknown");
      }
      // Auto-fill allergens
      if (Array.isArray(result.allergens) && result.allergens.length > 0) {
        const matched = result.allergens
          .map((a: string) => a.toLowerCase().trim())
          .filter((a) => ALLERGEN_OPTIONS.includes(a));
        if (matched.length > 0) setAllergens((prev) => [...new Set([...prev, ...matched])]);
      }
      // Auto-fill foodCategories — read both field names, then map keywords
      const rawCategories: string[] = [
        ...((result as any).foodCategories || []),
        ...((result as any).suggestedCategories || []),
      ];
      if (rawCategories.length > 0) {
        const mapped = mapToAllowedCategories(rawCategories);
        if (mapped.length > 0) setFoodCategories((prev) => [...new Set([...prev, ...mapped])]);
      }
    } catch {
      // non-blocking
    } finally {
      setIsSuggesting(false);
    }
  };

  // ── Combine date + time into ISO string ────────────────────────────────

  const combineDatetime = (date: string, time: string): string | undefined => {
    if (!date) return undefined;
    // If time missing, default to midnight
    return time ? `${date}T${time}` : `${date}T00:00`;
  };

  // ── Best-before validation (runs on either date or time change) ────────

  const validateBestBefore = (date: string, time: string) => {
    const combined = combineDatetime(date, time);
    if (combined && new Date(combined) < new Date()) {
      setBestBeforeWarning("⚠️ Best before time is already past — this food may not be safe to donate.");
    } else {
      setBestBeforeWarning("");
    }
  };

  const onBestBeforeDateChange = (val: string) => {
    setBestBeforeDate(val);
    validateBestBefore(val, bestBeforeTime);
  };
  const onBestBeforeTimeChange = (val: string) => {
    setBestBeforeTime(val);
    validateBestBefore(bestBeforeDate, val);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.totalPrepared || !form.remaining) {
      setError("Please fill in food amounts.");
      return;
    }
    if (allergens.length === 0) {
      setError("Please select allergen information (choose 'others' if none apply).");
      return;
    }

    const donorLocation =
      pickupLocation.address || profile.location || profile.address || "Pickup address pending";

    const payload = {
      donorType: role === "restaurant" ? ("restaurant" as const) : ("individual" as const),
      donorName: profile.name || profile.businessName || "Anonymous",
      donorPhone: profile.phone || "Not provided",
      donorLocation,
      pickupAddress: donorLocation,
      pickupLat: pickupLocation.lat,
      pickupLng: pickupLocation.lng,
      ...form,
      photo,
      // New fields — combine split date + time into ISO strings
      preparedAt: combineDatetime(preparedDate, preparedTime),
      bestBefore: combineDatetime(bestBeforeDate, bestBeforeTime),
      storageCondition: storageCondition || undefined,
      ingredients: ingredients.trim() || undefined,
      allergens,
      foodType: foodType || undefined,
      foodCategories,
    };

    setIsSubmitting(true);
    setError("");
    addDonation(payload);
    try {
      await createDonationPost(payload);
    } catch {
      setError(
        "Saved locally. Backend API is not reachable, so sync will retry when the server is connected."
      );
    }
    setSubmitted(true);
    setForm({ totalPrepared: "", remaining: "", category: "normal", description: "" });
    setPreparedDate("");
    setPreparedTime("");
    setBestBeforeDate("");
    setBestBeforeTime("");
    setStorageCondition("");
    setIngredients("");
    setAllergens([]);
    setFoodType("");
    setFoodCategories([]);
    setPickupLocation({});
    setPhoto(undefined);
    setAiSuggestion(null);
    setIsSubmitting(false);
    setTimeout(() => setSubmitted(false), 4000);
  };

  // ─── JSX ───────────────────────────────────────────────────────────────────

  return (
    <>
      <style>{`
        /* Hide native date/time/select icons and replace with visible custom SVGs */
        input[type="date"],
        input[type="time"],
        input[type="datetime-local"] {
          color-scheme: dark !important;
          position: relative;
        }
        /* Hide native WebKit icons */
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator,
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          opacity: 0 !important;
          position: absolute;
          right: 0;
          top: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }
        /* Calendar icon for date inputs */
        input[type="date"] {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='4' width='18' height='18' rx='2' ry='2'/%3E%3Cline x1='16' y1='2' x2='16' y2='6'/%3E%3Cline x1='8' y1='2' x2='8' y2='6'/%3E%3Cline x1='3' y1='10' x2='21' y2='10'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 12px center !important;
          background-size: 16px !important;
          padding-right: 40px !important;
        }
        /* Clock icon for time inputs */
        input[type="time"] {
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Ccircle cx='12' cy='12' r='10'/%3E%3Cpolyline points='12 6 12 12 16 14'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 12px center !important;
          background-size: 16px !important;
          padding-right: 40px !important;
        }
        /* Chevron for select dropdowns */
        select {
          color-scheme: dark !important;
          -webkit-appearance: none !important;
          -moz-appearance: none !important;
          appearance: none !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='rgba(255,255,255,0.4)' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: right 14px center !important;
          background-size: 12px !important;
          padding-right: 38px !important;
        }
      `}</style>
    <section style={{ padding: "6rem 2rem", background: "#0f0d0a" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <span
          style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "0.95rem",
            letterSpacing: "0.18em",
            color: "rgba(255,255,255,0.9)",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          Donate Your Surplus
        </span>
        <h2
          style={{
            fontFamily: "'Playfair Display', serif",
            fontSize: "clamp(1.8rem, 3vw, 2.6rem)",
            color: "rgba(255,255,255,0.95)",
            margin: "1rem 0 0.5rem",
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          Share Your Leftover Food
        </h2>
        <p
          style={{
            color: "rgba(255,255,255,0.78)",
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: 28,
            fontSize: "1rem",
            lineHeight: 1.65,
          }}
        >
          Tell us how much food you have. NGOs nearby will be notified for pickup.
        </p>

        <form onSubmit={handleSubmit} style={card}>

          {/* ── Core quantities ──────────────────────────────────────────── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={label}>Total Food Prepared</label>
              <input
                style={inputStyle}
                placeholder="e.g. 50 plates / 20 kg"
                value={form.totalPrepared}
                onChange={(e) => setForm({ ...form, totalPrepared: e.target.value })}
              />
            </div>
            <div>
              <label style={label}>Remaining Food</label>
              <input
                style={inputStyle}
                placeholder="e.g. 12 plates / 5 kg"
                value={form.remaining}
                onChange={(e) => setForm({ ...form, remaining: e.target.value })}
              />
            </div>
          </div>

          {/* ── Food Category ─────────────────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Food Category</label>
            <div style={{ display: "flex", gap: 10 }}>
              {(["healthy", "normal", "junk"] as const).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, category: c })}
                  style={{
                    flex: 1,
                    padding: "0.75rem 1rem",
                    borderRadius: 10,
                    background: form.category === c ? "#FF5722" : "transparent",
                    color: form.category === c ? "#fff" : "rgba(255,255,255,0.72)",
                    border: `1px solid ${form.category === c ? "#FF5722" : "rgba(255,255,255,0.12)"}`,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "1rem",
                    transition: "all 0.15s",
                  }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* ── Description + AI Suggest ──────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ ...label, marginBottom: 0 }}>Description</label>
              <button
                type="button"
                onClick={handleAiSuggest}
                disabled={isSuggesting || form.description.trim().length < 3}
                style={{
                  background: "rgba(99,102,241,0.15)",
                  color: "#818cf8",
                  border: "1px solid rgba(99,102,241,0.3)",
                  padding: "5px 12px",
                  borderRadius: 8,
                  cursor: isSuggesting || form.description.trim().length < 3 ? "not-allowed" : "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  opacity: form.description.trim().length < 3 ? 0.5 : 1,
                  transition: "opacity 0.2s",
                }}
              >
                {isSuggesting ? "Analysing…" : "✨ AI Auto-Fill"}
              </button>
            </div>
            <textarea
              style={{ ...inputStyle, minHeight: 80, resize: "vertical" } as any}
              placeholder="Briefly describe the food (cuisine, packaging, freshness)… then click AI Auto-Fill"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            {aiSuggestion && (
              <div
                style={{
                  marginTop: 10,
                  background: "rgba(99,102,241,0.08)",
                  border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: 12,
                  padding: "12px 16px",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.88rem",
                  color: "rgba(255,255,255,0.85)",
                }}
              >
                <strong style={{ color: "#818cf8" }}>✨ AI Auto-Filled</strong>
                <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {aiSuggestion.foodType && (
                    <span style={{ background: "rgba(74,222,128,0.12)", color: "#4ade80", padding: "2px 10px", borderRadius: 99, fontSize: "0.8rem", fontWeight: 600 }}>
                      {aiSuggestion.foodType}
                    </span>
                  )}
                  <span style={{ background: "rgba(255,87,34,0.12)", color: "#FF5722", padding: "2px 10px", borderRadius: 99, fontSize: "0.8rem", fontWeight: 600, textTransform: "capitalize" }}>
                    {form.category}
                  </span>
                </div>
                {aiSuggestion.allergens && aiSuggestion.allergens.length > 0 && (
                  <div style={{ marginTop: 6, color: "#fbbf24" }}>
                    ⚠️ Allergens auto-selected: {aiSuggestion.allergens.join(", ")}
                  </div>
                )}
                {aiSuggestion.reasoning && (
                  <div style={{ marginTop: 6, color: "rgba(255,255,255,0.45)", fontSize: "0.8rem", fontStyle: "italic" }}>
                    {aiSuggestion.reasoning}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Food Prep Details ─────────────────────────────────────────── */}
          <div style={sectionTitle}>Food Preparation Details</div>



          {/* Prepared At — date + time */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Prepared At</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ ...label, fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>Prepared Date</label>
                <input
                  className="bs-dt-input"
                  type="date"
                  style={{ ...inputStyle, colorScheme: "dark" }}
                  value={preparedDate}
                  onChange={(e) => setPreparedDate(e.target.value)}
                />
              </div>
              <div>
                <label style={{ ...label, fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>Prepared Time</label>
                <input
                  className="bs-dt-input"
                  type="time"
                  style={{ ...inputStyle, colorScheme: "dark" }}
                  value={preparedTime}
                  onChange={(e) => setPreparedTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Best Before — date + time */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Best Before</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ ...label, fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>Best Before Date</label>
                <input
                  className="bs-dt-input"
                  type="date"
                  style={{
                    ...inputStyle,
                    colorScheme: "dark",
                    borderColor: bestBeforeWarning ? "#fbbf24" : "rgba(255,255,255,0.12)",
                  }}
                  value={bestBeforeDate}
                  onChange={(e) => onBestBeforeDateChange(e.target.value)}
                />
              </div>
              <div>
                <label style={{ ...label, fontSize: "0.8rem", color: "rgba(255,255,255,0.45)", marginBottom: 4 }}>Best Before Time</label>
                <input
                  className="bs-dt-input"
                  type="time"
                  style={{
                    ...inputStyle,
                    colorScheme: "dark",
                    borderColor: bestBeforeWarning ? "#fbbf24" : "rgba(255,255,255,0.12)",
                  }}
                  value={bestBeforeTime}
                  onChange={(e) => onBestBeforeTimeChange(e.target.value)}
                />
              </div>
            </div>
            {bestBeforeWarning && (
              <p style={{ color: "#fbbf24", fontSize: "0.8rem", marginTop: 5, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                {bestBeforeWarning}
              </p>
            )}
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Storage Condition</label>
            <select
              className="bs-dark-select"
              style={inputStyle}
              value={storageCondition}
              onChange={(e) => setStorageCondition(e.target.value as any)}
            >
              <option value="">Select storage condition</option>
              <option value="room_temp">Room Temperature</option>
              <option value="refrigerated">Refrigerated</option>
              <option value="frozen">Frozen</option>
            </select>
          </div>

          {/* ── Ingredients ──────────────────────────────────────────────── */}
          <div style={sectionTitle}>Ingredients &amp; Allergens</div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Ingredients (optional)</label>
            <textarea
              style={{ ...inputStyle, minHeight: 64, resize: "vertical" } as any}
              placeholder="e.g. rice, dal, mixed vegetables, spices…"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <label style={{ ...label, marginBottom: 0 }}>
                Allergens <span style={{ color: "#FF5722" }}>*</span>
              </label>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.75rem", color: "rgba(255,255,255,0.35)" }}>
                Select all that apply — choose "others" if none
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ALLERGEN_OPTIONS.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => toggleChip(a, allergens, setAllergens)}
                  style={chipStyle(allergens.includes(a), "#fbbf24")}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* ── Food Classification ──────────────────────────────────────── */}
          <div style={sectionTitle}>Food Classification</div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Food Type</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(["veg", "non-veg", "vegan"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFoodType(t)}
                  style={{
                    ...chipStyle(foodType === t, "#4ade80"),
                    padding: "8px 20px",
                    borderRadius: 10,
                    fontSize: "0.9rem",
                    textTransform: "capitalize",
                  }}
                >
                  {t === "veg" ? "🥦 Veg" : t === "non-veg" ? "🍗 Non-Veg" : "🌱 Vegan"}
                </button>
              ))}
            </div>
          </div>

          {/* ── Food Categories ───────────────────────────────────────────── */}
          <div style={{ marginBottom: 16 }}>
            <label style={label}>Food Categories (select all that apply)</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {FOOD_CATEGORY_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggleChip(c, foodCategories, setFoodCategories)}
                  style={{ ...chipStyle(foodCategories.includes(c), "#818cf8"), textTransform: "capitalize" }}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* ── Pickup Location ──────────────────────────────────────────── */}
          <div style={sectionTitle}>Pickup Location</div>
          <DonationLocationPicker value={pickupLocation} onChange={setPickupLocation} />

          {/* ── Photo Upload ─────────────────────────────────────────────── */}
          <div style={sectionTitle}>Photo Upload</div>
          <div style={{ marginBottom: 20 }}>
            <label style={label}>Upload Photo (max 10 MB)</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFile}
              style={{ ...inputStyle, padding: 10 }}
            />

            {photo && (
              <div style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "flex-start" }}>
                <img
                  src={photo}
                  alt="Food preview"
                  style={{
                    width: 110,
                    height: 110,
                    objectFit: "cover",
                    borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.1)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingTop: 2 }}>
                  <button
                    type="button"
                    onClick={handleValidateImage}
                    disabled={isValidatingImage}
                    style={{
                      background: "transparent",
                      color: "#FF5722",
                      border: "1px solid rgba(255,87,34,0.4)",
                      padding: "6px 14px",
                      borderRadius: 8,
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      cursor: isValidatingImage ? "not-allowed" : "pointer",
                      opacity: isValidatingImage ? 0.6 : 1,
                      transition: "background 0.15s, color 0.15s",
                      width: "fit-content",
                    }}
                    onMouseEnter={(e) => { if (!isValidatingImage) { e.currentTarget.style.background = "#FF5722"; e.currentTarget.style.color = "#fff"; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#FF5722"; }}
                  >
                    {isValidatingImage ? "Validating…" : "✨ Validate Image"}
                  </button>

                  {imageSuccess && (
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "#4ade80", lineHeight: 1.4 }}>
                      {imageSuccess}
                    </span>
                  )}
                  {imageWarning && (
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.78rem", color: "#fbbf24", lineHeight: 1.4 }}>
                      ⚠️ {imageWarning}
                    </span>
                  )}

                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: "0.68rem", color: "rgba(255,255,255,0.18)", lineHeight: 1.3, marginTop: 1 }}>
                    Optional — you can submit without validation.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── Feedback ─────────────────────────────────────────────────── */}
          {error && (
            <p style={{ color: "#ff6b6b", fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", margin: "0 0 10px", lineHeight: 1.55 }}>
              {error}
            </p>
          )}
          {submitted && (
            <p style={{ color: "#4ade80", fontFamily: "'DM Sans', sans-serif", fontSize: "0.95rem", margin: "0 0 10px", lineHeight: 1.55 }}>
              Donation posted! Nearby NGOs can now see pickup distance and route details.
            </p>
          )}

          <button
            type="submit"
            style={{
              background: "#FF5722",
              color: "#fff",
              border: "none",
              padding: "1rem 2rem",
              borderRadius: 10,
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: "1rem",
              cursor: "pointer",
              opacity: isSubmitting ? 0.7 : 1,
              marginTop: 4,
            }}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Posting..." : "Post Donation"}
          </button>
        </form>
      </div>
    </section>
    </>
  );
}
