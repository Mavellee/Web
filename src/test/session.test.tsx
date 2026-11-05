import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { Signup, VerifyEmail } from "../pages/auth/AuthPages";
import { mockApi, renderWithProviders } from "./utils";

const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
const unauthorized = () => json(401, { error: { code: "UNAUTHENTICATED", message: "Please log in." } });

afterEach(() => vi.unstubAllGlobals());

describe("access-token renewal", () => {
  it("renews once on a 401 and retries the call", async () => {
    let renewed = false;
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/auth/refresh") return ((renewed = true), json(200, { data: { refreshed: true } }));
      return renewed ? json(200, { data: { ok: 1 } }) : unauthorized();
    });
    vi.stubGlobal("fetch", fetchMock);
    await expect(api.get("/matches")).resolves.toEqual({ ok: 1 });
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(["/api/matches", "/api/auth/refresh", "/api/matches"]);
  });

  it("shares one renewal between parallel calls", async () => {
    let renewed = false;
    const fetchMock = vi.fn(async (url: string) => {
      if (url === "/api/auth/refresh") {
        await new Promise((r) => setTimeout(r, 20));
        renewed = true;
        return json(200, { data: { refreshed: true } });
      }
      return renewed ? json(200, { data: url }) : unauthorized();
    });
    vi.stubGlobal("fetch", fetchMock);
    await Promise.all([api.get("/a"), api.get("/b"), api.get("/c"), api.get("/d")]);
    expect(fetchMock.mock.calls.filter((c) => c[0] === "/api/auth/refresh")).toHaveLength(1);
  });

  it("reports a real sign-out as 401, and a dropped connection as a network error", async () => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => (url === "/api/auth/refresh" ? json(401, { error: { code: "INVALID_REFRESH", message: "ended" } }) : unauthorized())));
    await expect(api.get("/matches")).rejects.toMatchObject({ status: 401 });

    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (url === "/api/auth/refresh") throw new TypeError("Failed to fetch");
        return unauthorized();
      }),
    );
    const err: unknown = await api.get("/matches").catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).code).toBe("NETWORK");
  });

  it("never tries to renew around sign-in calls", async () => {
    const fetchMock = vi.fn(async () => json(401, { error: { code: "INVALID_CREDENTIALS", message: "That email and password do not match." } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(api.post("/auth/login", { email: "a@b.co", password: "x" })).rejects.toMatchObject({ status: 401 });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("sign-up", () => {
  it("asks people to check their email, and can resend without being signed in", async () => {
    const { calls } = mockApi({
      "POST /auth/register": { status: 202, body: { data: { checkEmail: true } } },
      "POST /auth/resend-verification": { body: { data: { sent: true } } },
    });
    renderWithProviders(
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
      </Routes>,
    );
    await userEvent.type(screen.getByLabelText("Email"), "new.person@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "CorrectHorse42");
    await userEvent.type(screen.getByLabelText("Date of birth"), `${new Date().getFullYear() - 30}-01-01`);
    await userEvent.click(screen.getByLabelText("I confirm I am 18 years of age or older."));
    await userEvent.click(screen.getByRole("checkbox", { name: /I agree to the/ }));
    await userEvent.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByRole("heading", { name: "Check your email" })).toBeInTheDocument();
    expect(screen.getByText("new.person@example.com")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Resend email" }));
    await waitFor(() => expect(calls.find((c) => c.key === "POST /auth/resend-verification")?.body).toEqual({ email: "new.person@example.com" }));
  });
});
