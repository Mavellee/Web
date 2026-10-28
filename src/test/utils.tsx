import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axe from "axe-core";
import { vi } from "vitest";
import { AuthProvider } from "../lib/auth";
import { ToastProvider } from "../components/ui/Toast";

/** Routes fetch() calls by "METHOD /path" to canned JSON responses. */
export function mockApi(routes: Record<string, { status?: number; body: unknown } | ((init?: RequestInit) => { status?: number; body: unknown })>) {
  const calls: { key: string; body?: unknown }[] = [];
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const key = `${(init?.method ?? "GET").toUpperCase()} ${url.replace(/^\/api/, "").split("?")[0]}`;
    calls.push({ key, body: init?.body ? JSON.parse(String(init.body)) : undefined });
    const route = routes[key];
    const res = typeof route === "function" ? route(init) : route ?? { status: 401, body: { error: { code: "UNAUTHENTICATED", message: "Please log in." } } };
    return new Response(JSON.stringify(res.body), { status: res.status ?? 200, headers: { "Content-Type": "application/json" } });
  });
  vi.stubGlobal("fetch", fn);
  return { fn, calls };
}

export function renderWithProviders(ui: ReactElement, { route = "/" } = {}) {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

/** Runs axe on a container. Colour contrast is checked separately (jsdom can't compute styles). */
export async function axeViolations(container: Element) {
  const result = await axe.run(container, { rules: { "color-contrast": { enabled: false }, region: { enabled: false } } });
  return result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`);
}
