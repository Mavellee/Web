import { z } from "zod";

/**
 * Configuration that is SAFE to expose to the browser.
 *
 * Next.js only inlines variables it can see written out literally as `process.env.NEXT_PUBLIC_X`,
 * so each one is referenced explicitly below (do not loop over process.env).
 * Anything secret must go in env.server.ts instead.
 */
const schema = z.object({
  NEXT_PUBLIC_APP_URL: z.url().default("http://localhost:3000"),
});

export const publicEnv = schema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || undefined,
});
