const enabled =
  process.env.DEBUG_LOGS === "true" ||
  process.env.DEBUG_LOGS === "1" ||
  process.env.NODE_ENV === "development";

const redactKeys = new Set(["password", "token", "authorization", "jwt", "secret"]);

const sanitize = (value) => {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key,
      redactKeys.has(key.toLowerCase()) ? "[redacted]" : sanitize(entry),
    ])
  );
};

const timestamp = () => new Date().toISOString();

export const logger = {
  debug(message, meta) {
    if (!enabled) return;
    console.log(`[${timestamp()}] [debug] ${message}`, meta ? sanitize(meta) : "");
  },
  info(message, meta) {
    if (!enabled) return;
    console.log(`[${timestamp()}] [info] ${message}`, meta ? sanitize(meta) : "");
  },
  warn(message, meta) {
    console.warn(`[${timestamp()}] [warn] ${message}`, meta ? sanitize(meta) : "");
  },
  error(message, meta) {
    console.error(`[${timestamp()}] [error] ${message}`, meta ? sanitize(meta) : "");
  },
  sanitize,
};
