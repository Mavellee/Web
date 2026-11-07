// Thin fetch wrapper for the Mavelle API. HttpOnly cookies carry the access and refresh tokens, so no script on the
// page can read them. When the 15-minute access token has expired, the next call renews it once and retries.
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: Record<string, string[] | undefined> & { missing?: string[] },
  ) {
    super(message);
  }
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Calls that must not trigger a renewal (they are the renewal, or happen while signed out).
const NO_REFRESH = /^\/auth\/(login|register|google|refresh|logout|verify-email|forgot-password|reset-password|resend-verification|mobile\/)/;

let renewing: Promise<boolean> | null = null;

/**
 * Renews the access token with the refresh cookie. Concurrent callers share one request, so tabs and parallel
 * calls never race each other. Resolves false when the session has really ended; throws on network failure,
 * so a dropped connection never looks like being signed out.
 */
export function renewSession(): Promise<boolean> {
  renewing ??= fetch("/api/auth/refresh", { method: "POST", credentials: "same-origin" })
    .then((r) => r.ok)
    .catch(() => {
      throw new ApiError(0, "NETWORK", "We couldn't reach Mavelle. Check your connection and try again.");
    })
    .finally(() => {
      renewing = null;
    });
  return renewing;
}

async function request<T>(method: Method, path: string, body?: unknown, retried = false): Promise<T> {
  const isForm = body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method,
      credentials: "same-origin",
      headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK", "We couldn't reach Mavelle. Check your connection and try again.");
  }
  if (res.status === 401 && !retried && !NO_REFRESH.test(path) && (await renewSession())) return request<T>(method, path, body, true);
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const e = json?.error;
    throw new ApiError(res.status, e?.code ?? "UNKNOWN", e?.message ?? "Something went wrong. Please try again.", e?.details);
  }
  return json.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body: unknown = {}) => request<T>("POST", path, body),
  put: <T>(path: string, body: unknown = {}) => request<T>("PUT", path, body),
  patch: <T>(path: string, body: unknown = {}) => request<T>("PATCH", path, body),
  delete: <T>(path: string, body?: unknown) => request<T>("DELETE", path, body),
};

export const photoUrl = (id: string) => `/api/photos/${id}`;
/** Videos stream from the same URL as photos; their still frame is served separately. */
export const mediaUrl = photoUrl;
export const posterUrl = (id: string) => `/api/photos/${id}/poster`;
