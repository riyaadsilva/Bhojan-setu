import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

const resolveBearerToken = (header = "") => (header.startsWith("Bearer ") ? header.slice(7) : null);

export const protect = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || "";
  const token = resolveBearerToken(header);

  if (!token) {
    logger.warn("auth:missing_token", { requestId: req.requestId, url: req.originalUrl });
    const error = new Error("Authentication token required.");
    error.statusCode = 401;
    throw error;
  }

  const decoded = jwt.verify(token, env.jwtSecret);
  logger.debug("auth:token_verified", { requestId: req.requestId, userId: decoded.id });
  const user = await User.findById(decoded.id).select("-password");

  if (!user) {
    logger.warn("auth:user_not_found", { requestId: req.requestId, userId: decoded.id });
    const error = new Error("User not found.");
    error.statusCode = 401;
    throw error;
  }

  req.user = user;
  logger.debug("auth:user_attached", { requestId: req.requestId, userId: user._id, role: user.role });
  next();
});

export const attachUserIfPresent = asyncHandler(async (req, _res, next) => {
  const token = resolveBearerToken(req.headers.authorization || "");

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(decoded.id).select("-password");

    if (user) {
      req.user = user;
      logger.debug("auth:user_attached_optional", {
        requestId: req.requestId,
        userId: user._id,
        role: user.role,
      });
    }
  } catch (error) {
    logger.warn("auth:optional_attach_failed", {
      requestId: req.requestId,
      message: error.message,
    });
  }

  next();
});

export const requireRole = (...roles) => (req, _res, next) => {
  if (!roles.includes(req.user?.role)) {
    logger.warn("auth:role_denied", {
      requestId: req.requestId,
      userId: req.user?._id,
      role: req.user?.role,
      requiredRoles: roles,
    });
    const error = new Error("You do not have permission to access this resource.");
    error.statusCode = 403;
    throw error;
  }

  logger.debug("auth:role_allowed", {
    requestId: req.requestId,
    userId: req.user?._id,
    role: req.user?.role,
    requiredRoles: roles,
  });
  next();
};
