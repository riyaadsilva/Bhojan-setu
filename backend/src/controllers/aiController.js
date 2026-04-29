import Donation from "../models/Donation.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";
import {
  aiChat,
  demandPrediction,
  recommendNGOs,
  suggestFoodMetadata,
  validateFoodImage,
} from "../services/aiService.js";

// POST /api/ai/validate-image
export const validateImage = async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return res.status(400).json({ success: false, message: "imageBase64 (string) is required." });
    }

    logger.debug("ai:validate_image", {
      requestId: req.requestId,
      sizeChars: imageBase64.length,
    });

    const result = await validateFoodImage(imageBase64);

    logger.info("ai:validate_image_success", {
      requestId: req.requestId,
      validFood: result.validFood,
      confidence: result.confidence,
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error("ai:validate_image_error", { message: error.message });
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/ai/suggest-category
export const suggestCategory = asyncHandler(async (req, res) => {
  const { description } = req.body;

  if (!description || typeof description !== "string" || description.trim().length < 3) {
    const error = new Error("description (at least 3 characters) is required.");
    error.statusCode = 400;
    throw error;
  }

  logger.debug("ai:suggest_category", {
    requestId: req.requestId,
    descriptionLength: description.length,
  });

  const result = await suggestFoodMetadata(description.trim());

  logger.info("ai:suggest_category_success", {
    requestId: req.requestId,
    foodType: result.foodType,
    healthCategory: result.healthCategory,
  });

  res.json({ success: true, data: result });
});

// POST /api/ai/chat
export const chat = asyncHandler(async (req, res) => {
  const { message, userRole } = req.body;

  if (!message || typeof message !== "string" || message.trim().length < 1) {
    const error = new Error("message is required.");
    error.statusCode = 400;
    throw error;
  }

  const validRoles = ["individual", "restaurant", "ngo"];
  const role = validRoles.includes(userRole) ? userRole : "individual";

  logger.debug("ai:chat", {
    requestId: req.requestId,
    role,
    messageLength: message.length,
  });

  const result = await aiChat(message.trim(), role);

  logger.info("ai:chat_success", {
    requestId: req.requestId,
    role,
    replyLength: result.reply.length,
  });

  res.json({ success: true, data: result });
});

// GET /api/ai/demand-prediction
export const getDemandPrediction = asyncHandler(async (req, res) => {
  logger.debug("ai:demand_prediction", { requestId: req.requestId });

  // Pull recent donations (last 30 days) for analysis
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const donations = await Donation.find({ createdAt: { $gte: since } })
    .select("createdAt donorLocation pickupAddress donor")
    .populate("donor", "profile")
    .lean();

  const result = demandPrediction(donations);

  logger.info("ai:demand_prediction_success", {
    requestId: req.requestId,
    totalAnalysed: result.totalAnalysed,
  });

  res.json({ success: true, data: result });
});

// POST /api/ai/recommend-ngos
export const getRecommendedNGOs = asyncHandler(async (req, res) => {
  const { donation, ngos } = req.body;

  if (!donation || typeof donation !== "object") {
    const error = new Error("donation object is required.");
    error.statusCode = 400;
    throw error;
  }
  if (!Array.isArray(ngos)) {
    const error = new Error("ngos array is required.");
    error.statusCode = 400;
    throw error;
  }

  logger.debug("ai:recommend_ngos", {
    requestId: req.requestId,
    ngoCount: ngos.length,
    category: donation.category,
  });

  const ranked = recommendNGOs(donation, ngos);

  logger.info("ai:recommend_ngos_success", {
    requestId: req.requestId,
    rankedCount: ranked.length,
  });

  res.json({ success: true, count: ranked.length, data: ranked });
});
