import { connection } from "next/server";
import { query } from "@/server/db/pool";
import { getLogger } from "@/server/logger";

/**
 * Readiness: "can this instance actually serve traffic?" Checks the database.
 * Used by the staging -> production smoke test and by uptime alerts.
 */
export async function GET() {
  await connection();
  const headers = { "cache-control": "no-store" };
  try {
    const started = performance.now();
    await query("select 1");
    return Response.json(
      { status: "ready", checks: { database: { ok: true, ms: Math.round(performance.now() - started) } } },
      { headers },
    );
  } catch (err) {
    getLogger().error({ err }, "readiness check failed: database");
    return Response.json(
      { status: "unavailable", checks: { database: { ok: false } } },
      { status: 503, headers },
    );
  }
}
