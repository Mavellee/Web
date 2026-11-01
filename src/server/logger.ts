import "server-only";
import pino from "pino";
import { getServerEnv } from "@/env.server";

/**
 * Structured JSON logs (Vercel / Better Stack / Sentry can all search JSON fields).
 * Every request-scoped log line carries `requestId` via logger.child({ requestId }).
 *
 * NEVER log: OTP codes, tokens, full phone numbers/emails, message bodies, birth details.
 * `redact` is a safety net, not a licence to log those things.
 */
function create() {
  const env = getServerEnv();
  return pino({
    level: env.LOG_LEVEL ?? (env.APP_ENV === "local" ? "debug" : "info"),
    base: { app: "iceberg-web", env: env.APP_ENV },
    redact: {
      paths: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.token", "*.otp", "*.phone", "*.email"],
      censor: "[redacted]",
    },
  });
}

let instance: pino.Logger | undefined;

export function getLogger(): pino.Logger {
  return (instance ??= create());
}
