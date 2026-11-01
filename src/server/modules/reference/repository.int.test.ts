import { afterAll, describe, expect, it } from "vitest";
import { getPool } from "@/server/db/pool";
import { interestSchema, collegeSchema } from "@/shared/schemas/reference";
import { listActiveColleges, listInterests } from "./repository";

/**
 * Integration test: runs the real SQL against a real, migrated and seeded database.
 * Skipped unless TEST_DATABASE_URL is set (CI sets it; locally:
 *   TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5433/iceberg npm test)
 * It exists to catch "the query no longer matches the schema" before staging does.
 */
describe.skipIf(!process.env.TEST_DATABASE_URL)("reference repository (integration)", () => {
  afterAll(async () => {
    await getPool().end();
  });

  it("lists interests that match the shared schema", async () => {
    const rows = await listInterests();
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((r) => expect(() => interestSchema.parse(r)).not.toThrow());
  });

  it("lists only active colleges that match the shared schema", async () => {
    const rows = await listActiveColleges();
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach((r) => expect(() => collegeSchema.parse(r)).not.toThrow());
  });
});
