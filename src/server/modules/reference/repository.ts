import "server-only";
import { query } from "@/server/db/pool";
import type { College, Interest } from "@/shared/schemas/reference";

/** Repository = SQL only. No permission checks, no business rules (see docs/02-architecture.md). */
export async function listInterests(): Promise<Interest[]> {
  const { rows } = await query<Interest>("select id, name, category from interests order by category, name");
  return rows;
}

export async function listActiveColleges(): Promise<College[]> {
  const { rows } = await query<College>("select id, name, city from colleges where is_active order by name");
  return rows;
}
