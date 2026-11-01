import "server-only";
import { z } from "zod";

/**
 * Server-only configuration, validated once.
 *
 * Why validate? A missing or malformed variable should stop a deploy (see instrumentation.ts),
 * not surface as a confusing error for the first user who touches that code path.
 *
 * Add a variable here in the same PR that first uses it, and add it to web/.env.example.
 * Variables for later milestones are listed in docs/04-environments-and-deployment.md.
 */
const schema = z.object({
  // Which of our three environments we are in. NOT the same as NODE_ENV (Vercel sets that to
  // "production" for staging too, because both are optimised builds).
  APP_ENV: z.enum(["local", "staging", "production"]).default("local"),

  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal", "silent"]).optional(),

  // Postgres. In staging/production use the Supabase *pooler* URL (port 6543).
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .refine((v) => /^postgres(ql)?:\/\//.test(v), "DATABASE_URL must start with postgres:// or postgresql://"),
  // Keep small on serverless: every function instance opens its own pool.
  DB_POOL_MAX: z.coerce.number().int().min(1).max(20).default(5),
  // auto = TLS unless the host is localhost. Use "disable" only for odd local setups.
  DB_SSL: z.enum(["auto", "require", "disable"]).default("auto"),
  // Optional PEM of the database CA. When set, the server certificate is fully verified.
  DB_SSL_CA: z.string().optional(),
});

export type ServerEnv = z.infer<typeof schema>;

let cached: ServerEnv | undefined;

/** Parses process.env on first call and caches the result. Throws a readable error if invalid. */
export function getServerEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const lines = parsed.error.issues.map((i) => `  - ${i.path.join(".") || "(root)"}: ${i.message}`);
    throw new Error(`Invalid environment configuration:\n${lines.join("\n")}\nSee web/.env.example`);
  }
  cached = parsed.data;
  return cached;
}

/** Test helper: forget the cached value so a test can change process.env. */
export function resetServerEnvForTests() {
  cached = undefined;
}
