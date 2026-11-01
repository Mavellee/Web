import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getServerEnv, resetServerEnvForTests } from "./env.server";

describe("getServerEnv", () => {
  const original = { ...process.env };

  beforeEach(() => resetServerEnvForTests());
  afterEach(() => {
    process.env = { ...original };
    resetServerEnvForTests();
  });

  it("applies defaults", () => {
    process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
    delete process.env.DB_POOL_MAX;
    const env = getServerEnv();
    expect(env.DB_POOL_MAX).toBe(5);
    expect(env.DB_SSL).toBe("auto");
  });

  it("fails fast with a readable message when DATABASE_URL is missing", () => {
    delete process.env.DATABASE_URL;
    expect(() => getServerEnv()).toThrow(/DATABASE_URL/);
  });

  it("rejects a non-postgres URL", () => {
    process.env.DATABASE_URL = "mysql://nope";
    expect(() => getServerEnv()).toThrow(/postgres/);
  });

  it("rejects an unknown APP_ENV", () => {
    process.env.DATABASE_URL = "postgresql://u:p@localhost:5432/db";
    process.env.APP_ENV = "prod"; // typo: must be "production"
    expect(() => getServerEnv()).toThrow(/APP_ENV/);
  });
});
