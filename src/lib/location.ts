/** The member's own location as the server reports it. Coordinates are never sent back, not even to their owner. */
export type LocationView = {
  city: string | null;
  region: string | null;
  country: string | null;
  source: "DEVICE" | "MANUAL" | null;
  hasLocation: boolean;
  updatedAt: string | null;
  deviceConsent: boolean;
  maxDistanceKm: number | null;
  showDistance: boolean;
};

export type Place = { id: string; name: string; region: string; country: string };

export const RADIUS_OPTIONS = [5, 10, 25, 50, 100] as const;

export const placeLabel = (p: { name?: string; city?: string | null; region?: string | null; country?: string | null }) =>
  [p.name ?? p.city, p.region, p.country && p.country !== "India" ? p.country : null].filter(Boolean).join(", ");

export type PositionProblem = "unsupported" | "insecure" | "denied" | "unavailable" | "timeout";

export const POSITION_MESSAGES: Record<PositionProblem, string> = {
  unsupported: "This browser can't share a location. Choose your place by hand instead.",
  insecure: "Location only works over a secure (https) connection. Choose your place by hand instead.",
  denied: "Location access is turned off for Mavelle. You can allow it in your browser or device settings, or choose your place by hand.",
  unavailable: "We couldn't work out where you are right now. Check that location services are on, or choose your place by hand.",
  timeout: "Finding your location took too long. Try again, or choose your place by hand.",
};

export class PositionError extends Error {
  constructor(public problem: PositionProblem) {
    super(POSITION_MESSAGES[problem]);
  }
}

/**
 * Asks the browser for one approximate position, only when the member has chosen to share it.
 * Low accuracy is enough: the result is rounded to ~1 km here and again on the server. Nothing is watched or tracked.
 */
export function currentPosition(timeoutMs = 10000): Promise<{ lat: number; lon: number }> {
  if (typeof window !== "undefined" && window.isSecureContext === false) return Promise.reject(new PositionError("insecure"));
  if (!("geolocation" in navigator)) return Promise.reject(new PositionError("unsupported"));
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: Math.round(pos.coords.latitude * 100) / 100, lon: Math.round(pos.coords.longitude * 100) / 100 }),
      (err) => reject(new PositionError(err.code === err.PERMISSION_DENIED ? "denied" : err.code === err.TIMEOUT ? "timeout" : "unavailable")),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 10 * 60 * 1000 },
    ),
  );
}

/** "granted" | "denied" | "prompt", or null where the browser can't say. Follows changes made in browser or device settings. */
export async function watchPermission(onChange: (state: PermissionState | null) => void): Promise<() => void> {
  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    onChange(status.state);
    const listener = () => onChange(status.state);
    status.addEventListener("change", listener);
    return () => status.removeEventListener("change", listener);
  } catch {
    onChange(null);
    return () => {};
  }
}
