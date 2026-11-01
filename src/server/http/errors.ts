/**
 * Every failure the API can report is an AppError with a stable machine-readable `code`.
 * The frontend switches on `code` (never on the English message), and support can search logs by it.
 *
 * Throw these from services. The route wrapper (route.ts) turns them into the JSON error body.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  constructor(message = "The request is not valid.", details?: unknown) {
    super(400, "validation_failed", message, details);
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = "Please sign in to continue.") {
    super(401, "unauthorized", message);
  }
}
export class ForbiddenError extends AppError {
  constructor(message = "You are not allowed to do that.") {
    super(403, "forbidden", message);
  }
}
export class NotFoundError extends AppError {
  constructor(message = "Not found.") {
    super(404, "not_found", message);
  }
}
export class ConflictError extends AppError {
  constructor(message = "This conflicts with the current state.", code = "conflict") {
    super(409, code, message);
  }
}
/** A business rule said no (e.g. a database function raised an exception we wrote). */
export class DomainError extends AppError {
  constructor(message: string) {
    super(422, "rule_violation", message);
  }
}
export class RateLimitedError extends AppError {
  constructor(public readonly retryAfterSeconds: number) {
    super(429, "rate_limited", "Too many requests. Please slow down.");
  }
}

/** Postgres error shape we care about (from the `pg` driver). */
type PgError = { code?: string; message?: string; constraint?: string };

/**
 * Translate a database error into an AppError, or return null if it is not one we recognise.
 *
 * Only errors *we* authored are safe to show users:
 *   P0001 = `raise exception '...'` inside our SQL functions (e.g. "Profile not available").
 * Everything else (syntax errors, connection failures, ...) stays a generic 500 so we never leak schema.
 */
export function mapDatabaseError(err: unknown): AppError | null {
  const e = err as PgError | null;
  if (!e || typeof e !== "object" || typeof e.code !== "string") return null;
  switch (e.code) {
    case "P0001":
      return new DomainError(e.message ?? "Action not allowed.");
    case "23505": // unique_violation
      return new ConflictError("That already exists.", "already_exists");
    case "23503": // foreign_key_violation
      return new NotFoundError("A related item does not exist.");
    case "23514": // check_violation (e.g. under 18, bio too long)
      return new ValidationError(e.message ?? "A value is out of range.");
    default:
      return null;
  }
}
