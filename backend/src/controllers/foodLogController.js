import FoodLog from "../models/FoodLog.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

export const getFoodLogs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.user) filter.user = req.query.user;
  if (!req.query.user && req.user?._id) filter.user = req.user._id;
  logger.debug("food_logs:list", { requestId: req.requestId, filter });

  const logs = await FoodLog.find(filter).populate("user", "role email profile").sort({ createdAt: -1 });
  logger.info("food_logs:list_success", { requestId: req.requestId, count: logs.length });
  res.json({ success: true, count: logs.length, data: logs });
});

export const createFoodLog = asyncHandler(async (req, res) => {
  const {
    food_name,
    food_prepared,
    food_consumed,
    food_leftover,
    preparedQuantity,
    consumedQuantity,
    donatedQuantity,
    wastedQuantity,
    foodCategory,
    logDate,
    donorId,
    donorType,
    unit,
    notes,
    user,
  } = req.body;
  const resolvedPrepared = preparedQuantity ?? food_prepared;
  const resolvedConsumed = consumedQuantity ?? food_consumed;
  const resolvedLeftover = food_leftover ?? (
    resolvedPrepared !== undefined && resolvedConsumed !== undefined
      ? Math.max(Number(resolvedPrepared) - Number(resolvedConsumed), 0)
      : undefined
  );
  const resolvedDonated = donatedQuantity ?? 0;
  const resolvedWasted = wastedQuantity ?? (
    resolvedPrepared !== undefined && resolvedConsumed !== undefined
      ? Math.max(Number(resolvedPrepared) - Number(resolvedConsumed) - Number(resolvedDonated), 0)
      : undefined
  );

  logger.debug("food_logs:create_attempt", {
    requestId: req.requestId,
    food_name,
    food_prepared: resolvedPrepared,
    food_consumed: resolvedConsumed,
    food_leftover: resolvedLeftover,
    donatedQuantity: resolvedDonated,
    wastedQuantity: resolvedWasted,
    unit,
    user: user || req.user?._id,
  });

  if (!food_name || resolvedPrepared === undefined || resolvedConsumed === undefined || resolvedLeftover === undefined) {
    const error = new Error("food_name, food_prepared, food_consumed, and food_leftover are required.");
    error.statusCode = 400;
    throw error;
  }

  const log = await FoodLog.create({
    user: user || req.user?._id,
    donorId: donorId || req.user?._id || user,
    donorType: donorType || req.user?.role,
    food_name,
    food_prepared: resolvedPrepared,
    food_consumed: resolvedConsumed,
    food_leftover: resolvedLeftover,
    preparedQuantity: resolvedPrepared,
    consumedQuantity: resolvedConsumed,
    donatedQuantity: resolvedDonated,
    wastedQuantity: resolvedWasted,
    foodCategory,
    logDate,
    unit,
    notes,
  });

  logger.info("food_logs:create_success", { requestId: req.requestId, foodLogId: log._id, food_name: log.food_name });
  res.status(201).json({ success: true, data: log });
});

export const getFoodLogById = asyncHandler(async (req, res) => {
  logger.debug("food_logs:detail", { requestId: req.requestId, foodLogId: req.params.id });
  const log = await FoodLog.findById(req.params.id).populate("user", "role email profile");

  if (!log) {
    const error = new Error("Food log not found.");
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: log });
});

export const deleteFoodLog = asyncHandler(async (req, res) => {
  logger.debug("food_logs:delete_attempt", { requestId: req.requestId, foodLogId: req.params.id });
  const log = await FoodLog.findByIdAndDelete(req.params.id);

  if (!log) {
    const error = new Error("Food log not found.");
    error.statusCode = 404;
    throw error;
  }

  logger.info("food_logs:delete_success", { requestId: req.requestId, foodLogId: log._id });
  res.json({ success: true, data: log });
});
