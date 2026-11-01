/**
 * Runs once when the server process starts (Next.js "instrumentation" hook).
 * We use it to fail fast: if configuration is invalid, the instance refuses to boot, so a bad
 * deploy shows up as a failed health check on staging instead of as errors for users.
 * Sentry will be initialised here in Milestone 1.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { getServerEnv } = await import("@/env.server");
    getServerEnv();
  }
}
