import "server-only";
import { Pool, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { getServerEnv } from "@/env.server";

/**
 * One connection pool per server instance.
 *
 * Production notes:
 * - On Vercel every function instance runs this module, so `max` is small (default 5). Total
 *   connections = instances x max, which is why the URL must be Supabase's *pooler* (PgBouncer,
 *   transaction mode, port 6543) and not the direct Postgres port.
 * - Transaction-mode pooling forbids session state and *named* prepared statements. We never use
 *   either: plain parameterised queries only, no `SET`, no `LISTEN`.
 * - The pool is cached on globalThis so Next.js hot reload in dev does not leak connections.
 */
type GlobalWithPool = typeof globalThis & { __icebergPool?: Pool };

function isLocalHost(connectionString: string): boolean {
  try {
    const host = new URL(connectionString).hostname;
    return ["localhost", "127.0.0.1", "::1", "[::1]", "host.docker.internal"].includes(host);
  } catch {
    return false;
  }
}

function createPool(): Pool {
  const env = getServerEnv();
  const useTls = env.DB_SSL === "require" || (env.DB_SSL === "auto" && !isLocalHost(env.DATABASE_URL));

  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: env.DB_POOL_MAX,
    idleTimeoutMillis: 10_000, // give connections back quickly: serverless instances freeze
    connectionTimeoutMillis: 5_000, // fail fast instead of hanging a request
    statement_timeout: 10_000, // no query may run longer than 10 s
    application_name: `iceberg-web-${env.APP_ENV}`,
    ssl: useTls ? (env.DB_SSL_CA ? { ca: env.DB_SSL_CA, rejectUnauthorized: true } : { rejectUnauthorized: false }) : false,
  });

  // An idle client erroring (e.g. DB restart) must not crash the process.
  pool.on("error", (err) => {
    console.error(JSON.stringify({ level: "error", msg: "pg idle client error", err: err.message }));
  });
  return pool;
}

export function getPool(): Pool {
  const g = globalThis as GlobalWithPool;
  return (g.__icebergPool ??= createPool());
}

/** Run one parameterised query. Always pass user input through `params`, never string-concatenate. */
export async function query<R extends QueryResultRow = QueryResultRow>(
  text: string,
  params: readonly unknown[] = [],
): Promise<QueryResult<R>> {
  return getPool().query<R>(text, params as unknown[]);
}

/**
 * Run several statements atomically. Commits if `fn` resolves, rolls back if it throws.
 * Use this for multi-step changes that are NOT already a single SQL function.
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
