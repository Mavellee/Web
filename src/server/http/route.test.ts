import { describe, expect, it } from "vitest";
import { z } from "zod";
import { apiRoute, ok } from "./route";
import { ConflictError } from "./errors";

const req = (init?: RequestInit & { url?: string }) =>
  new Request(init?.url ?? "http://localhost/api/v1/test", init);

describe("apiRoute", () => {
  it("returns { data } and an x-request-id header", async () => {
    const route = apiRoute({ auth: "public" }, async () => ok({ hello: "world" }));
    const res = await route(req());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { hello: "world" } });
    expect(res.headers.get("x-request-id")).toMatch(/^[\w-]{8,64}$/);
  });

  it("reuses a clean incoming request id but replaces a hostile one", async () => {
    const route = apiRoute({ auth: "public" }, async () => ok(null));
    const good = await route(req({ headers: { "x-request-id": "trace-abc12345" } }));
    expect(good.headers.get("x-request-id")).toBe("trace-abc12345");

    const bad = await route(req({ headers: { "x-request-id": "<script>INJECTED LOG LINE</script>" } }));
    expect(bad.headers.get("x-request-id")).not.toContain("INJECTED");
  });

  it("converts an AppError into the standard error body", async () => {
    const route = apiRoute({ auth: "public" }, async () => {
      throw new ConflictError("Already liked.", "already_liked");
    });
    const res = await route(req());
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.error).toMatchObject({ code: "already_liked", message: "Already liked." });
    expect(body.error.requestId).toBe(res.headers.get("x-request-id"));
  });

  it("hides the details of unexpected errors", async () => {
    const route = apiRoute({ auth: "public" }, async () => {
      throw new Error('relation "secret_table" does not exist');
    });
    const res = await route(req());
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).toContain("internal_error");
    expect(text).not.toContain("secret_table");
  });

  it("maps database errors we authored", async () => {
    const route = apiRoute({ auth: "public" }, async () => {
      throw Object.assign(new Error("Profile not available"), { code: "P0001" });
    });
    const res = await route(req());
    expect(res.status).toBe(422);
    expect((await res.json()).error.message).toBe("Profile not available");
  });

  it("validates JSON bodies with Zod and reports which field failed", async () => {
    const schema = z.object({ toUserId: z.uuid() });
    const route = apiRoute({ auth: "public" }, async (ctx) => ok(await ctx.body(schema)));

    const bad = await route(req({ method: "POST", body: JSON.stringify({ toUserId: "nope" }) }));
    expect(bad.status).toBe(400);
    const body = await bad.json();
    expect(body.error.code).toBe("validation_failed");
    expect(body.error.details[0].path).toBe("toUserId");

    const notJson = await route(req({ method: "POST", body: "{oops" }));
    expect(notJson.status).toBe(400);
  });

  it("validates query strings", async () => {
    const schema = z.object({ limit: z.coerce.number().int().min(1).max(50).default(20) });
    const route = apiRoute({ auth: "public" }, async (ctx) => ok(ctx.query(schema)));
    expect((await (await route(req({ url: "http://localhost/x?limit=5" }))).json()).data.limit).toBe(5);
    expect((await route(req({ url: "http://localhost/x?limit=999" }))).status).toBe(400);
  });

  it("is closed by default for authenticated routes until real auth is wired (M1)", async () => {
    const route = apiRoute({ auth: "user" }, async () => ok("secret"));
    const res = await route(req());
    expect(res.status).toBe(401);
    expect((await res.json()).error.code).toBe("unauthorized");
  });

  it("passes route params through", async () => {
    const route = apiRoute<{ id: string }>({ auth: "public" }, async (ctx) => ok({ id: ctx.params.id }));
    const res = await route(req(), { params: Promise.resolve({ id: "abc" }) });
    expect((await res.json()).data.id).toBe("abc");
  });
});
