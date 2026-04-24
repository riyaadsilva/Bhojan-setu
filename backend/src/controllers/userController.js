import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

export const getUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  const filter = {};

  if (role) filter.role = role;
  if (search) {
    filter.$or = [
      { email: new RegExp(search, "i") },
      { "profile.name": new RegExp(search, "i") },
      { "profile.businessName": new RegExp(search, "i") },
      { "profile.ngoName": new RegExp(search, "i") },
      { "profile.location": new RegExp(search, "i") },
      { "profile.area": new RegExp(search, "i") },
    ];
  }
  logger.debug("users:list", { requestId: req.requestId, filter });

  const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
  logger.info("users:list_success", { requestId: req.requestId, count: users.length });
  res.json({ success: true, count: users.length, data: users });
});

export const getUserById = asyncHandler(async (req, res) => {
  logger.debug("users:detail", { requestId: req.requestId, userId: req.params.id });
  const user = await User.findById(req.params.id).select("-password");

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: user });
});

export const updateUser = asyncHandler(async (req, res) => {
  const { role, status, ...profilePatch } = req.body;
  const update = {};
  logger.debug("users:update_attempt", { requestId: req.requestId, userId: req.params.id, role, status, profileKeys: Object.keys(profilePatch) });

  if (role) update.role = role;
  if (status) update.status = status;
  if (Object.keys(profilePatch).length) {
    for (const [key, value] of Object.entries(profilePatch)) {
      update[`profile.${key}`] = value;
    }
    if (profilePatch.email) update.email = profilePatch.email.toLowerCase().trim();
  }

  const user = await User.findByIdAndUpdate(req.params.id, update, {
    new: true,
    runValidators: true,
  }).select("-password");

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    throw error;
  }

  logger.info("users:update_success", { requestId: req.requestId, userId: user._id, role: user.role, status: user.status });
  res.json({ success: true, data: user });
});
