import { connection } from "next/server";

/**
 * Liveness: "is the process up?" Touches nothing external, so it answers even when the DB is down.
 * Uptime monitors and load balancers ping this. (See /api/ready for dependency checks.)
 */
export async function GET() {
  await connection(); // opt out of build-time prerendering: report the *running* instance
  return Response.json(
    { status: "ok", env: process.env.APP_ENV ?? "local", commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null },
    { headers: { "cache-control": "no-store" } },
  );
}
