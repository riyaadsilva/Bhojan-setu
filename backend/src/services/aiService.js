import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

// ─── Shared helpers ───────────────────────────────────────────────────────────

async function groqChat(messages, { temperature = 0.4, maxTokens = 512 } = {}) {
  if (!env.groqApiKey) throw new Error("GROQ_API_KEY is not configured.");

  const response = await fetch(env.groqApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.groqApiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`Groq API error ${response.status}: ${body}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

function safeJsonParse(text) {
  // Extract first JSON object/array from the response, ignoring surrounding prose
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

// ─── 1. validateFoodImage ─────────────────────────────────────────────────────

const FOOD_KEYWORDS = [
  "food", "meal", "dish", "plate", "bowl", "hot pot", "hotpot", "consomme",
  "soup", "rice", "bread", "curry", "dal", "vegetable", "fruit", "meat",
  "fish", "egg", "cheese", "pizza", "burger", "sandwich", "noodle", "pasta",
  "wok", "pot", "salad", "stew", "biryani", "roti", "chapati", "dosa",
  "samosa", "paneer", "chicken", "mutton", "prawn", "cake", "dessert",
  "ice cream", "pudding", "fry", "grill", "roast", "bake", "dumpling",
  "muffin", "taco", "burrito", "sushi", "ramen", "pho",
  "tray", "container", "utensil",
];

// Labels that virtually always mean food is present (serving vessels / cookware)
const AUTO_PASS_LABELS = [
  "plate", "bowl", "dish", "pot", "wok", "hot pot", "hotpot", "consomme",
  "tray", "soup bowl", "mixing bowl",
];

export async function validateFoodImage(imageBase64) {
  if (!env.huggingfaceApiKey) {
    logger.warn("ai:validate_image_skipped", { reason: "HUGGINGFACE_API_KEY not set" });
    return { validFood: true, confidence: 0, labels: [], skipped: true };
  }

  // Strip data-URL prefix if present ("data:image/jpeg;base64,...")
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const binaryBuffer = Buffer.from(base64Data, "base64");

  let response;
  try {
    response = await fetch(env.huggingfaceApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.huggingfaceApiKey}`,
        "Content-Type": "application/octet-stream",
      },
      body: binaryBuffer,
    });
  } catch (err) {
    // Network failure — don't block the donor
    console.log("HF STATUS:", { error: err.message });
    return { validFood: true, confidence: 0, labels: [], skipped: true, loading: true };
  }

  if (!response.ok) {
    // HF may return 503 while model is loading, or other transient errors
    console.log("HF STATUS:", { status: response.status });
    return { validFood: true, confidence: 0, labels: [], skipped: true, loading: true };
  }

  // HF image-classification model returns [{label, score}, ...]
  const results = await response.json();
  console.log("HF RAW RESPONSE:", JSON.stringify(results, null, 2));

  if (!Array.isArray(results)) {
    console.log("HF STATUS:", results);
    return { validFood: true, confidence: 0, labels: [], skipped: true, loading: true };
  }

  const topLabels = results.slice(0, 5).map((r) => ({ label: r.label, score: r.score }));
  const topScore = topLabels[0]?.score ?? 0;

  // Check if any top-5 label contains a food-related keyword
  const matchesKeyword = topLabels.some((item) => {
    const lbl = item.label.toLowerCase();
    return FOOD_KEYWORDS.some((kw) => lbl.includes(kw));
  });

  // Auto-pass if top label is a serving vessel / cookware (virtually always food)
  const topLabelLower = (topLabels[0]?.label || "").toLowerCase();
  const isServingVessel = AUTO_PASS_LABELS.some((v) => topLabelLower.includes(v));

  const validFood = topScore > 0.08 || matchesKeyword || isServingVessel;

  console.log("AI VALID FOOD RESULT:", {
    validFood,
    topLabel: topLabels[0]?.label,
    topScore,
    matchesKeyword,
    isServingVessel,
    labels: topLabels,
  });

  return {
    validFood,
    confidence: Math.round(topScore * 100),
    labels: topLabels,
  };
}

// ─── 2. suggestFoodMetadata ───────────────────────────────────────────────────

export async function suggestFoodMetadata(description) {
  const systemPrompt = `You are a food classification assistant for an Indian food donation platform.
Given a food description, respond ONLY with a JSON object (no prose) in this exact shape:
{
  "foodType": "veg" | "non-veg" | "vegan" | "unknown",
  "healthCategory": "healthy" | "normal" | "junk",
  "foodCategories": ["protein", "grains", "fruits", "vegetables", "dairy"],
  "allergens": ["nuts", "dairy", "gluten", "soy", "eggs", "seafood", "others"],
  "reasoning": "short explanation"
}

IMPORTANT RULES:
- foodCategories MUST only contain values from: protein, grains, fruits, vegetables, dairy
  Examples: rice/bread/roti/chapati/noodles/pasta → "grains", dal/chicken/fish/egg/paneer/meat/mutton/prawn → "protein", milk/cheese/curd/raita/yogurt → "dairy", sabzi/salad → "vegetables", fruit → "fruits"
- allergens MUST only contain values from: nuts, dairy, gluten, soy, eggs, seafood, others
  If no allergens apply, use ["others"]
- Pick ALL matching foodCategories, not just one`;

  const content = await groqChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: `Classify this food: "${description}"` },
    ],
    { temperature: 0.2, maxTokens: 300 }
  );

  const parsed = safeJsonParse(content);
  if (!parsed) {
    logger.warn("ai:suggest_metadata_parse_fail", { raw: content.slice(0, 200) });
    return {
      foodType: "unknown",
      healthCategory: "normal",
      foodCategories: [],
      suggestedCategories: [],
      allergens: [],
      reasoning: "Could not parse AI response.",
    };
  }

  // Normalize: accept both field names for backward compatibility
  if (!parsed.foodCategories && parsed.suggestedCategories) {
    parsed.foodCategories = parsed.suggestedCategories;
  }
  if (!parsed.suggestedCategories && parsed.foodCategories) {
    parsed.suggestedCategories = parsed.foodCategories;
  }

  return parsed;
}

// ─── 3. aiChat ────────────────────────────────────────────────────────────────

const ROLE_CONTEXT = {
  individual: "individual food donor who has surplus home-cooked food to donate",
  restaurant: "restaurant or caterer donating surplus prepared food",
  ngo: "NGO volunteer or staff member who collects and distributes donated food",
};

export async function aiChat(message, userRole = "individual") {
  const roleDescription = ROLE_CONTEXT[userRole] || ROLE_CONTEXT.individual;

  const systemPrompt = `You are BhojanBot, a helpful assistant for BhojanSetu, an Indian food rescue platform.
The user is a ${roleDescription}.
Answer questions about: food donation, food safety, NGO coordination, pickup logistics, and reducing food waste.
Be concise, warm, and practical. Respond in 2-4 sentences unless more detail is needed.
Do NOT discuss topics unrelated to food rescue, donation, or the platform.`;

  const content = await groqChat(
    [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ],
    { temperature: 0.6, maxTokens: 400 }
  );

  return { reply: content.trim() };
}

// ─── 4. recommendNGOs ────────────────────────────────────────────────────────

export function recommendNGOs(donation, ngos) {
  if (!Array.isArray(ngos) || ngos.length === 0) return [];

  const categoryPriority = {
    healthy: ["healthy", "normal", "junk"],
    normal: ["normal", "healthy", "junk"],
    junk: ["junk", "normal", "healthy"],
  };

  const preferred = categoryPriority[donation.category] || ["normal", "healthy", "junk"];

  const scored = ngos.map((ngo) => {
    let score = 0;

    // Distance score (lower is better, invert for ranking)
    const distKm = typeof ngo.distanceKm === "number" ? ngo.distanceKm : 999;
    score += Math.max(0, 100 - distKm * 5);

    // Category match
    const ngoCategories = ngo.acceptedCategories || [];
    const matchIndex = preferred.findIndex((c) => ngoCategories.includes(c));
    if (matchIndex === 0) score += 30;
    else if (matchIndex === 1) score += 15;

    // Capacity (NGOs with higher max pickup capacity rank higher)
    const capacity = ngo.maxPickupQuantityKg ?? 50;
    score += Math.min(capacity, 30);

    return { ...ngo, aiScore: Math.round(score) };
  });

  return scored.sort((a, b) => b.aiScore - a.aiScore);
}

// ─── 5. demandPrediction ─────────────────────────────────────────────────────

export function demandPrediction(donations) {
  if (!Array.isArray(donations) || donations.length === 0) {
    return { peakHours: [], highDemandZones: [], totalAnalysed: 0 };
  }

  const hourCounts = Array(24).fill(0);
  const zoneCounts = {};

  for (const d of donations) {
    const created = new Date(d.createdAt || d.created_at);
    if (!isNaN(created.getTime())) {
      hourCounts[created.getHours()]++;
    }

    const zone =
      d.donorLocation ||
      d.pickupAddress ||
      (d.donor?.profile?.location) ||
      "Unknown";

    if (zone && zone !== "Unknown" && zone !== "Pickup address pending") {
      // Normalise: take first meaningful word/city token
      const key = zone.split(",")[0].trim();
      zoneCounts[key] = (zoneCounts[key] || 0) + 1;
    }
  }

  // Top 3 peak hours
  const peakHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3)
    .filter((h) => h.count > 0)
    .map(({ hour, count }) => ({
      hour,
      label: `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`,
      donationCount: count,
    }));

  // Top 5 high-demand zones
  const highDemandZones = Object.entries(zoneCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([zone, count]) => ({ zone, donationCount: count }));

  return {
    peakHours,
    highDemandZones,
    totalAnalysed: donations.length,
  };
}
