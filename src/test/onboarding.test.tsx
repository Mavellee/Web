import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Onboarding } from "../pages/auth/Onboarding";
import { axeViolations, mockApi, renderWithProviders } from "./utils";

const empty = { displayName: "", gender: null, interestedIn: [], bio: null, city: null, hasApproxLocation: false, languages: [], interests: [], intentions: [], soughtIntentions: [], ageMin: 18, ageMax: 60, maxDistanceKm: null, isPublished: false, isDiscoverable: true, discoveryPaused: false, photos: [], media: [], mediaLimits: { maxImages: 6, maxVideos: 2, captionMax: 150 }, prompts: [], dateOfBirth: "1998-05-02", age: 28 };
const started = { ...empty, displayName: "Asha", gender: "WOMAN", interestedIn: ["MAN"] };
const question = { id: "q1", key: "smoking", dimension: "LIFESTYLE", prompt: "Do you smoke?", options: [{ value: "no", label: "No" }, { value: "yes", label: "Yes" }], myAnswer: { answer: "no", acceptable: ["no"], importance: 3, isDealbreaker: true } };

const routes = (profile: object, extra: object = {}) => ({
  "GET /auth/me": { body: { data: { id: "u1", email: "a@knot.test", role: "MEMBER" } } },
  "GET /profiles/me": { body: { data: profile } },
  "GET /meta/interests": { body: { data: [] } },
  "GET /meta/cities": { body: { data: [{ name: "Pune", region: "Maharashtra" }] } },
  "GET /meta/prompts": { body: { data: [] } },
  "GET /compatibility/questions": { body: { data: [question] } },
  ...extra,
});

describe("Your Story", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) });
  });

  it("shows seven steps, progress, and locks later steps until a profile can exist", async () => {
    mockApi(routes(empty));
    const { container } = renderWithProviders(<Onboarding />);
    expect(await screen.findByLabelText("What should we call you?")).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Your story progress" });
    expect(within(nav).getAllByRole("button")).toHaveLength(7);
    expect(within(nav).getByRole("button", { name: "Step 2: Your Photos & Videos" })).toBeDisabled();
    expect(within(nav).getByText(/Step 1 of 7 · 1 complete · 6 to go/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Skip for now" })).not.toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("keeps an unfinished introduction on this device and explains what's missing, without calling the API", async () => {
    const { calls } = mockApi(routes(empty));
    renderWithProviders(<Onboarding />);
    await userEvent.type(await screen.findByLabelText("What should we call you?"), "Asha");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText("Choose the option that fits you best.")).toBeInTheDocument();
    expect(screen.getByText("Saved on this device")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem("knot:intro-draft:u1")!).displayName).toBe("Asha");
    expect(localStorage.getItem("knot:intro-draft:u1")).not.toContain("1998");
    expect(calls.some((c) => c.key === "PATCH /profiles/me")).toBe(false);
  });

  it("saves the introduction on Continue, without re-sending an unchanged city, and moves on", async () => {
    localStorage.setItem("knot:story-step:u1", "intro");
    const { calls } = mockApi(routes({ ...started, city: "Pune", hasApproxLocation: true }, { "PATCH /profiles/me": { body: { data: { ...started, city: "Pune", bio: "Hello" } } } }));
    renderWithProviders(<Onboarding />);
    await userEvent.type(await screen.findByLabelText(/Tell us a little about yourself/), "Hello");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("heading", { name: "Show your world." });
    const patch = calls.find((c) => c.key === "PATCH /profiles/me")?.body as Record<string, unknown>;
    expect(patch.bio).toBe("Hello");
    expect(patch).not.toHaveProperty("city");
  });

  it("resumes at the last step and lets optional steps be skipped", async () => {
    localStorage.setItem("knot:story-step:u1", "words");
    mockApi(routes(started));
    renderWithProviders(<Onboarding />);
    await screen.findByRole("heading", { name: "The little things that make you, you." });
    await userEvent.click(screen.getByRole("button", { name: "Skip for now" }));
    await screen.findByRole("heading", { name: "What do you love?" });
    expect(localStorage.getItem("knot:story-step:u1")).toBe("little");
  });

  it("lifestyle answers are marked private and keep their compatibility settings", async () => {
    localStorage.setItem("knot:story-step:u1", "lifestyle");
    const { calls } = mockApi(routes(started, { "PUT /compatibility/answers/q1": { body: { data: { answer: "yes", acceptable: ["no"], importance: 3, isDealbreaker: true } } } }));
    renderWithProviders(<Onboarding />);
    expect(await screen.findByText("Private to you.")).toBeInTheDocument();
    await userEvent.click(await screen.findByRole("button", { name: "Yes" }));
    await waitFor(() => expect(calls.find((c) => c.key === "PUT /compatibility/answers/q1")?.body).toEqual({ answer: "yes", acceptable: ["no"], importance: 3, isDealbreaker: true }));
  });

  it("blocks publishing only for what's truly required, and says what's missing", async () => {
    localStorage.setItem("knot:story-step:u1", "preview");
    mockApi(routes(started));
    renderWithProviders(<Onboarding />);
    expect(await screen.findByRole("button", { name: "Publish My Profile" })).toBeDisabled();
    expect(screen.getByText(/add a photo and the kind of connection/)).toBeInTheDocument();
    expect(screen.getByText("Ready for someone to discover your kind of connection?")).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/\d+%/);
  });
});
