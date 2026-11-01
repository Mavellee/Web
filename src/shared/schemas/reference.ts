import { z } from "zod";

/**
 * Shared between server and browser (no server-only imports here!).
 * The server uses these to shape responses; the client uses the inferred types.
 */
export const interestSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  category: z.string(),
});
export type Interest = z.infer<typeof interestSchema>;

export const collegeSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  city: z.string().nullable(),
});
export type College = z.infer<typeof collegeSchema>;
