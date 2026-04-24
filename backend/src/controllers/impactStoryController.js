import ImpactStory from "../models/ImpactStory.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

export const getImpactStories = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.published !== undefined) filter.published = req.query.published === "true";
  logger.debug("impact_stories:list", { requestId: req.requestId, filter });

  const stories = await ImpactStory.find(filter).sort({ createdAt: -1 });
  logger.info("impact_stories:list_success", { requestId: req.requestId, count: stories.length });
  res.json({ success: true, count: stories.length, data: stories });
});

export const createImpactStory = asyncHandler(async (req, res) => {
  logger.debug("impact_stories:create_attempt", { requestId: req.requestId, title: req.body?.title });
  const story = await ImpactStory.create(req.body);
  logger.info("impact_stories:create_success", { requestId: req.requestId, impactStoryId: story._id, title: story.title });
  res.status(201).json({ success: true, data: story });
});

export const updateImpactStory = asyncHandler(async (req, res) => {
  logger.debug("impact_stories:update_attempt", { requestId: req.requestId, impactStoryId: req.params.id });
  const story = await ImpactStory.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!story) {
    const error = new Error("Impact story not found.");
    error.statusCode = 404;
    throw error;
  }

  logger.info("impact_stories:update_success", { requestId: req.requestId, impactStoryId: story._id, title: story.title });
  res.json({ success: true, data: story });
});
