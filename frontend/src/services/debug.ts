const enabled =
  import.meta.env.VITE_DEBUG_LOGS === "true" ||
  import.meta.env.VITE_DEBUG_LOGS === "1" ||
  import.meta.env.DEV;
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://localhost:5000/api";

const redactKeys = new Set(["password", "token", "authorization", "jwt", "secret"]);

const sanitize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      redactKeys.has(key.toLowerCase()) ? "[redacted]" : sanitize(entry),
    ])
  );
};

export const debugLog = (message: string, meta?: unknown) => {
  if (!enabled) return;
  relayDebug("info", message, meta);
};

export const debugWarn = (message: string, meta?: unknown) => {
  if (!enabled) return;
  relayDebug("warn", message, meta);
};

export const debugError = (message: string, meta?: unknown) => {
  relayDebug("error", message, meta);
};

function relayDebug(level: "info" | "warn" | "error", message: string, meta?: unknown) {
  const payload = JSON.stringify({
    level,
    message,
    meta: sanitize(meta),
    page: typeof window !== "undefined" ? window.location.href : undefined,
    timestamp: new Date().toISOString(),
  });

  try {
    fetch(`${apiBaseUrl}/debug/client-log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Ignore logging transport failures.
  }
}
