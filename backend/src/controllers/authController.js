import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";
import { signToken } from "../utils/token.js";

const publicUser = (user) => ({
  id: user._id,
  role: user.role,
  email: user.email,
  profile: user.profile,
  status: user.status,
  createdAt: user.createdAt,
});

export const register = asyncHandler(async (req, res) => {
  const { role, password, ...profile } = req.body;
  const email = profile.email?.toLowerCase()?.trim();
  logger.debug("auth:register_attempt", { requestId: req.requestId, role, email });

  if (!role || !email || !password) {
    const error = new Error("role, email, and password are required.");
    error.statusCode = 400;
    throw error;
  }

  const exists = await User.findOne({ email });
  if (exists) {
    logger.warn("auth:register_duplicate_email", { requestId: req.requestId, role, email });
    const error = new Error("An account with this email already exists.");
    error.statusCode = 409;
    throw error;
  }

  const user = await User.create({
    role,
    email,
    password,
    profile: { ...profile, email },
  });

  logger.info("auth:register_success", { requestId: req.requestId, userId: user._id, role: user.role, email: user.email });
  res.status(201).json({
    success: true,
    token: signToken(user),
    user: publicUser(user),
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password, role } = req.body;
  logger.debug("auth:login_attempt", { requestId: req.requestId, role, email });

  if (!email || !password) {
    const error = new Error("email and password are required.");
    error.statusCode = 400;
    throw error;
  }

  const query = { email: email.toLowerCase().trim() };
  if (role) query.role = role;

  const user = await User.findOne(query).select("+password");
  if (!user || !(await user.comparePassword(password))) {
    logger.warn("auth:login_failed", { requestId: req.requestId, role, email });
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    throw error;
  }

  logger.info("auth:login_success", { requestId: req.requestId, userId: user._id, role: user.role, email: user.email });
  res.json({
    success: true,
    token: signToken(user),
    user: publicUser(user),
  });
});

export const me = asyncHandler(async (req, res) => {
  logger.debug("auth:me", { requestId: req.requestId, userId: req.user?._id, role: req.user?.role });
  res.json({ success: true, user: publicUser(req.user) });
});
