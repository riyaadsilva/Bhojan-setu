import { logger } from "../utils/logger.js";

export const notFound = (req, res, next) => {
  logger.warn("route:not_found", { requestId: req.requestId, method: req.method, url: req.originalUrl });
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

export const errorHandler = (error, req, res, _next) => {
  const statusCode = error.statusCode || 500;

  logger.error("request:error", {
    requestId: req.requestId,
    method: req.method,
    url: req.originalUrl,
    status: statusCode,
    message: error.message,
    errors: error.errors,
    stack: statusCode >= 500 ? error.stack : undefined,
  });

  res.status(statusCode).json({
    success: false,
    message: error.message || "Server error",
    errors: error.errors || undefined,
  });
};
