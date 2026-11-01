/**
 * The only way the browser talks to our API. Every call goes through apiFetch so that
 * error handling, JSON parsing and the request id live in exactly one place.
 *
 * Success body:  { data: T, meta?: {...} }
 * Error body:    { error: { code, message, requestId, details? } }   (see server/http/errors.ts)
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly requestId?: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type ApiSuccess<T> = { data: T; meta?: Record<string, unknown> };

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api/v1${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...init?.headers },
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    // Non-JSON response (e.g. an HTML error page from a proxy). Handled below.
  }

  if (!res.ok) {
    const err = (body as { error?: { code?: string; message?: string; requestId?: string; details?: unknown } } | null)
      ?.error;
    throw new ApiError(
      res.status,
      err?.code ?? "unknown_error",
      err?.message ?? `Request failed with status ${res.status}`,
      err?.requestId ?? res.headers.get("x-request-id") ?? undefined,
      err?.details,
    );
  }
  return (body as ApiSuccess<T>).data;
}
