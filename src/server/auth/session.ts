import "server-only";
import { UnauthorizedError } from "@/server/http/errors";

/**
 * Who is making this request?  (Milestone 1 replaces the body with Supabase Auth.)
 *
 * Contract that must survive the replacement:
 *   - returns the authenticated user's id, taken from a verified session cookie / JWT;
 *   - throws UnauthorizedError when there is no valid session;
 *   - NEVER reads the user id from the request body, query or a client-set header.
 *
 * Until M1 this denies everything, so any route declared `auth: "user"` is safely closed.
 */
export type SessionUser = { id: string; role: "user" | "astrologer" | "moderator" | "admin" };

export async function getSessionUser(request: Request): Promise<SessionUser> {
  void request; // used from M1 (cookie lookup)
  throw new UnauthorizedError();
}
