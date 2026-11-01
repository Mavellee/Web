import { describe, expect, it } from "vitest";
import { AppError, ConflictError, DomainError, ValidationError, mapDatabaseError } from "./errors";

describe("mapDatabaseError", () => {
  it("turns exceptions raised by our SQL functions (P0001) into a 422 with their message", () => {
    const mapped = mapDatabaseError({ code: "P0001", message: "Profile not available" });
    expect(mapped).toBeInstanceOf(DomainError);
    expect(mapped?.status).toBe(422);
    expect(mapped?.message).toBe("Profile not available");
  });

  it("maps unique violations to 409", () => {
    const mapped = mapDatabaseError({ code: "23505", message: "duplicate key value violates unique constraint" });
    expect(mapped).toBeInstanceOf(ConflictError);
    expect(mapped?.code).toBe("already_exists");
    // never leak constraint names / SQL text
    expect(mapped?.message).not.toMatch(/duplicate key/);
  });

  it("maps check violations (e.g. under 18) to 400", () => {
    expect(mapDatabaseError({ code: "23514", message: "User must be at least 18 years old" })).toBeInstanceOf(ValidationError);
  });

  it("returns null for anything unrecognised so it becomes a generic 500", () => {
    expect(mapDatabaseError({ code: "42P01", message: 'relation "x" does not exist' })).toBeNull();
    expect(mapDatabaseError(new Error("boom"))).toBeNull();
    expect(mapDatabaseError(null)).toBeNull();
  });
});

describe("AppError", () => {
  it("carries status, code and details", () => {
    const e = new AppError(418, "teapot", "short and stout", { a: 1 });
    expect([e.status, e.code, e.details]).toEqual([418, "teapot", { a: 1 }]);
  });
});
