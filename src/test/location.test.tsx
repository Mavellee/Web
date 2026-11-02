import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LocationSetup } from "../components/location/LocationSetup";
import { LocationSettings } from "../components/location/LocationSettings";
import type { LocationView } from "../lib/location";
import { axeViolations, mockApi, renderWithProviders } from "./utils";

const none: LocationView = { city: null, region: null, country: null, source: null, hasLocation: false, updatedAt: null, deviceConsent: false, maxDistanceKm: null, showDistance: true };
const pune: LocationView = { ...none, city: "Pune", region: "Maharashtra", country: "India", source: "MANUAL", hasLocation: true, updatedAt: new Date().toISOString() };
const device: LocationView = { ...none, city: "Koramangala", region: "Bengaluru, Karnataka", country: "India", source: "DEVICE", hasLocation: true, deviceConsent: true, updatedAt: new Date().toISOString() };

type Success = (p: { coords: { latitude: number; longitude: number } }) => void;
type Failure = (e: { code: number; PERMISSION_DENIED: 1; POSITION_UNAVAILABLE: 2; TIMEOUT: 3 }) => void;
const geo = (impl: (ok: Success, fail: Failure, options?: PositionOptions) => void) => {
  const getCurrentPosition = vi.fn(impl);
  Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition }, configurable: true });
  return getCurrentPosition;
};
const failWith = (code: 1 | 2 | 3) => (_ok: Success, fail: Failure) => fail({ code, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });

beforeEach(() => Object.defineProperty(window, "isSecureContext", { value: true, configurable: true }));
afterEach(() => vi.unstubAllGlobals());

describe("Location setup", () => {
  it("offers device, manual and skip, and explains before the browser is asked", async () => {
    const pos = geo((ok) => ok({ coords: { latitude: 12.935261, longitude: 77.624487 } }));
    const { calls } = mockApi({ "PUT /location/me": { body: { data: device } } });
    const onSkip = vi.fn();
    const { container } = renderWithProviders(<LocationSetup value={none} onChange={() => {}} onSkip={onSkip} />);
    expect(screen.getByRole("heading", { name: "Where are you looking for connection?" })).toBeInTheDocument();
    expect(screen.getByText("Set your location to discover people around you. Your exact location is always private.")).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);

    await userEvent.click(screen.getByRole("button", { name: "Use my current location" }));
    expect(screen.getByText("Before your browser asks")).toBeInTheDocument();
    expect(pos).not.toHaveBeenCalled(); // nothing is requested until they agree

    await userEvent.click(screen.getByRole("button", { name: "Allow and continue" }));
    await waitFor(() => expect(calls.find((c) => c.key === "PUT /location/me")?.body).toEqual({ source: "DEVICE", lat: 12.94, lon: 77.62, consent: true }));
    expect(pos.mock.calls[0][2]).toMatchObject({ enableHighAccuracy: false });
  });

  it("skipping never requests location", async () => {
    const pos = geo(() => {});
    mockApi({});
    const onSkip = vi.fn();
    renderWithProviders(<LocationSetup value={none} onChange={() => {}} onSkip={onSkip} />);
    await userEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    expect(onSkip).toHaveBeenCalled();
    expect(pos).not.toHaveBeenCalled();
  });

  it.each([
    [1, /turned off for Mavelle/],
    [2, /couldn't work out where you are/],
    [3, /took too long/],
  ] as const)("falls back to manual search when the device says %s", async (code, message) => {
    geo(failWith(code));
    const { calls } = mockApi({
      "GET /location/places": { body: { data: [{ id: "in-pune", name: "Pune", region: "Maharashtra", country: "India" }] } },
      "PUT /location/me": { body: { data: pune } },
    });
    const onChange = vi.fn();
    renderWithProviders(<LocationSetup value={none} onChange={onChange} />);
    await userEvent.click(screen.getByRole("button", { name: "Use my current location" }));
    await userEvent.click(screen.getByRole("button", { name: "Allow and continue" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    await userEvent.type(screen.getByRole("combobox"), "pu");
    await userEvent.click(await screen.findByRole("option", { name: /Pune/ }));
    await waitFor(() => expect(calls.find((c) => c.key === "PUT /location/me")?.body).toEqual({ source: "MANUAL", placeId: "in-pune" }));
    expect(onChange).toHaveBeenCalledWith(pune);
    expect(calls.some((c) => c.key === "PUT /location/me" && (c.body as { source: string }).source === "DEVICE")).toBe(false);
  });

  it("won't ask for location on an insecure page", async () => {
    Object.defineProperty(window, "isSecureContext", { value: false, configurable: true });
    const pos = geo(() => {});
    mockApi({});
    renderWithProviders(<LocationSetup value={none} onChange={() => {}} />);
    await userEvent.click(screen.getByRole("button", { name: "Use my current location" }));
    await userEvent.click(screen.getByRole("button", { name: "Allow and continue" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/secure \(https\)/);
    expect(pos).not.toHaveBeenCalled();
  });

  it("shows the saved place, never coordinates", () => {
    mockApi({});
    renderWithProviders(<LocationSetup value={device} onChange={() => {}} />);
    expect(screen.getByText("Koramangala, Bengaluru, Karnataka")).toBeInTheDocument();
    expect(screen.getByText(/rounded to about 1 km/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip for now" })).not.toBeInTheDocument();
  });
});

describe("Settings › Location & Discovery", () => {
  it("changes the radius, hides distance and removes the location", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    let current: LocationView = { ...pune, maxDistanceKm: 25 };
    const { calls } = mockApi({
      "GET /location/me": () => ({ body: { data: current } }),
      "PATCH /location/preferences": (init) => ((current = { ...current, ...JSON.parse(String(init?.body)) }), { body: { data: current } }),
      "DELETE /location/me": () => ((current = { ...none, showDistance: current.showDistance }), { body: { data: current } }),
    });
    renderWithProviders(<LocationSettings />);
    const radius = await screen.findByLabelText("Discovery distance");
    expect(radius).toHaveValue("25");
    expect([...(radius as HTMLSelectElement).options].map((o) => o.text)).toEqual(["Within 5 km", "Within 10 km", "Within 25 km", "Within 50 km", "Within 100 km", "Anywhere"]);
    await userEvent.selectOptions(radius, "10");
    await waitFor(() => expect(calls.find((c) => c.key === "PATCH /location/preferences")?.body).toEqual({ maxDistanceKm: 10 }));
    await userEvent.click(screen.getByRole("switch", { name: /Show my approximate distance/ }));
    await waitFor(() => expect(calls.filter((c) => c.key === "PATCH /location/preferences").at(-1)?.body).toEqual({ showDistance: false }));
    await userEvent.click(screen.getByRole("button", { name: "Remove my location" }));
    await waitFor(() => expect(calls.some((c) => c.key === "DELETE /location/me")).toBe(true));
    expect(await screen.findByText(/Set your location to use distance/)).toBeInTheDocument();
  });

  it("follows a permission turned off in browser or device settings", async () => {
    const listeners: (() => void)[] = [];
    const status = { state: "granted" as PermissionState, addEventListener: (_: string, l: () => void) => listeners.push(l), removeEventListener: () => {} };
    Object.defineProperty(navigator, "permissions", { value: { query: vi.fn(async () => status) }, configurable: true });
    mockApi({ "GET /location/me": { body: { data: device } } });
    renderWithProviders(<LocationSettings />);
    await screen.findByLabelText("Discovery distance");
    expect(screen.queryByText(/turned off for Mavelle in your browser/)).not.toBeInTheDocument();
    status.state = "denied";
    listeners.forEach((l) => l());
    expect(await screen.findByText(/turned off for Mavelle in your browser or device settings/)).toBeInTheDocument();
  });
});
