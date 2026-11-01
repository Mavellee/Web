import "server-only";
import { z } from "zod";
import type pino from "pino";
import { getLogger } from "@/server/logger";
import { getSessionUser, type SessionUser } from "@/server/auth/session";
import { AppError, ForbiddenError, ValidationError, mapDatabaseError, RateLimitedError } from "./errors";

/**
 * apiRoute() wraps every Route Handler so none of them can forget the boring-but-critical parts:
 *   1. a request id (returned in `x-request-id`, attached to every log line, shown in error bodies)
 *   2. authentication / role check (secure by default: you must say `auth: "public"` explicitly)
 *   3. one standard error format and correct status codes
 *   4. logging with duration
 *
 * A handler is just:  (ctx) => ok(data)   -- it should call exactly one service function.
 */

export type Role = SessionUser["role"];

export type ApiContext<P> = {
  request: Request;
  params: P;
  requestId: string;
  /** null only when the route is `auth: "public"`. */
  user: SessionUser | null;
  log: pino.BaseLogger;
  /** Parse + validate the JSON body. Throws ValidationError (400) on failure. */
  body<S extends z.ZodType>(schema: S): Promise<z.infer<S>>;
  /** Parse + validate the query string. */
  query<S extends z.ZodType>(schema: S): z.infer<S>;
};

type Options = {
  /** "public" = anyone; "user" = any signed-in user; or a list of allowed roles. */
  auth: "public" | "user" | readonly Role[];
};

type Handler<P> = (ctx: ApiContext<P>) => Promise<Response>;

/** 200/201 JSON success: { data, meta? } */
export function ok<T>(data: T, init: { status?: number; meta?: Record<string, unknown>; headers?: HeadersInit } = {}) {
  return Response.json(init.meta ? { data, meta: init.meta } : { data }, {
    status: init.status ?? 200,
    headers: init.headers,
  });
}

function formatZodIssues(error: z.ZodError) {
  return error.issues.map((i) => ({ path: i.path.join("."), message: i.message }));
}

export function apiRoute<P = Record<string, never>>(options: Options, handler: Handler<P>) {
  return async function route(request: Request, routeCtx?: { params: Promise<P> }): Promise<Response> {
    const started = performance.now();
    // Accept a caller-supplied id (handy for tracing from a gateway) only if it is clean, so a
    // hostile header cannot inject newlines or huge strings into our logs.
    const incoming = request.headers.get("x-request-id");
    const requestId = incoming && /^[\w-]{8,64}$/.test(incoming) ? incoming : crypto.randomUUID();
    const log = getLogger().child({ requestId, method: request.method, path: new URL(request.url).pathname });

    const respond = (res: Response) => {
      res.headers.set("x-request-id", requestId);
      return res;
    };

    try {
      // 1. Who is this? (secure by default)
      let user: SessionUser | null = null;
      if (options.auth !== "public") {
        user = await getSessionUser(request);
        if (Array.isArray(options.auth) && !options.auth.includes(user.role)) throw new ForbiddenError();
      }

      const ctx: ApiContext<P> = {
        request,
        params: (routeCtx ? await routeCtx.params : {}) as P,
        requestId,
        user,
        log,
        async body(schema) {
          let json: unknown;
          try {
            json = await request.json();
          } catch {
            throw new ValidationError("Request body must be valid JSON.");
          }
          const parsed = schema.safeParse(json);
          if (!parsed.success) throw new ValidationError("Some fields are invalid.", formatZodIssues(parsed.error));
          return parsed.data;
        },
        query(schema) {
          const raw = Object.fromEntries(new URL(request.url).searchParams);
          const parsed = schema.safeParse(raw);
          if (!parsed.success) throw new ValidationError("Some parameters are invalid.", formatZodIssues(parsed.error));
          return parsed.data;
        },
      };

      // 2. Do the work.
      const res = await handler(ctx);
      log.info({ status: res.status, ms: Math.round(performance.now() - started) }, "request completed");
      return respond(res);
    } catch (thrown) {
      // 3. One error format for everything.
      const appError =
        thrown instanceof AppError ? thrown : (mapDatabaseError(thrown) ?? null);

      if (appError) {
        // 4xx are the caller's problem: info/warn, not error (keeps alerting meaningful).
        log[appError.status >= 500 ? "error" : "warn"](
          { status: appError.status, code: appError.code, ms: Math.round(performance.now() - started) },
          appError.message,
        );
        const headers: Record<string, string> = {};
        if (appError instanceof RateLimitedError) headers["retry-after"] = String(appError.retryAfterSeconds);
        return respond(
          Response.json(
            { error: { code: appError.code, message: appError.message, requestId, details: appError.details } },
            { status: appError.status, headers },
          ),
        );
      }

      // Unknown error: log everything, tell the user nothing sensitive.
      log.error({ err: thrown, ms: Math.round(performance.now() - started) }, "unhandled error");
      return respond(
        Response.json(
          { error: { code: "internal_error", message: "Something went wrong on our side.", requestId } },
          { status: 500 },
        ),
      );
    }
  };
}
