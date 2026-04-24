import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const logClientDebug = (req, res) => {
  if (!env.debugLogs) {
    return res.status(204).end();
  }

  const { level = "debug", message = "client:log", meta } = req.body || {};
  const payload = {
    requestId: req.requestId,
    source: "frontend",
    level,
    message,
    meta,
  };

  if (level === "error") logger.error("client:debug", payload);
  else if (level === "warn") logger.warn("client:debug", payload);
  else logger.info("client:debug", payload);

  return res.status(204).end();
};
