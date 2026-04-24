import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const startedAt = Date.now();
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  req.requestId = requestId;
  logger.info("request:start", {
    requestId,
    method: req.method,
    url: req.originalUrl,
    query: req.query,
    body: req.method === "GET" ? undefined : req.body,
  });

  res.on("finish", () => {
    logger.info("request:finish", {
      requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - startedAt,
      userId: req.user?._id,
      role: req.user?.role,
    });
  });

  next();
};
