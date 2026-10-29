import { describe, expect, it, vi } from "vitest";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { EditorialProfile, type EditorialData } from "../components/story/EditorialProfile";
import { MediaWorkspace } from "../components/story/MediaWorkspace";
import { Discover } from "../pages/app/Discover";
import type { MediaItem, MediaLimits, OwnMediaItem } from "../lib/types";
import { axeViolations, mockApi, renderWithProviders } from "./utils";

const limits: MediaLimits = { maxPhotos: 6, maxVideos: 2, captionMax: 200, videoMaxSeconds: 30, videoMaxBytes: 50 * 1048576, photoMaxBytes: 5 * 1048576 };
const item = (id: string, over: Partial<OwnMediaItem> = {}): OwnMediaItem => ({ id, kind: "IMAGE", position: 0, status: "APPROVED", caption: null, isPrimary: false, focusX: 50, focusY: 50, durationMs: null, hasPoster: false, ...over });

const gallery: MediaItem[] = [
  { id: "v1", kind: "VIDEO", caption: "Proof that I will always stop to pet a dog.", isPrimary: false, focusX: 50, focusY: 50, durationMs: 12000, hasPoster: true },
  { id: "p1", kind: "IMAGE", caption: "My favourite sunset.", isPrimary: true, focusX: 50, focusY: 30, durationMs: null, hasPoster: false },
  { id: "p2", kind: "IMAGE", caption: null, isPrimary: false, focusX: 50, focusY: 50, durationMs: null, hasPoster: false },
  { id: "p3", kind: "IMAGE", caption: "A little memory from my Goa trip.", isPrimary: false, focusX: 50, focusY: 50, durationMs: null, hasPoster: false },
];

const person = (id: string, name: string, over: Partial<EditorialData> = {}): EditorialData => ({
  id,
  displayName: name,
  age: 29,
  gender: "WOMAN",
  city: "Noida",
  distance: null,
  bio: "Bookshops and long walks.",
  languages: ["English"],
  intentions: ["MARRIAGE"],
  interests: [{ slug: "reading", name: "Reading", shared: true }],
  sharedInterestCount: 1,
  photoIds: ["p1", "p2", "p3"],
  media: gallery,
  prompts: [{ key: "ideal_sunday", text: "My ideal Sunday looks like…", answer: "Slow breakfast, then a bookshop." }],
  isApprovedExpert: false,
  compatibility: null,
  ...over,
});

describe("media workspace", () => {
  it("gives each item its own caption with a live preview, counter, save and discard", async () => {
    const { calls } = mockApi({ "PATCH /profiles/me/photos/p2": { body: { data: item("p2", { caption: "A little memory from my Goa trip." }) } } });
    const onChange = vi.fn();
    renderWithProviders(<MediaWorkspace media={[item("p1", { isPrimary: true, caption: "My favourite sunset." }), item("p2", { position: 1 })]} limits={limits} onChange={onChange} />);
    const rows = screen.getAllByRole("listitem").filter((li) => within(li).queryByLabelText(/Caption/));
    expect(rows).toHaveLength(2);

    const second = within(rows[1]).getByLabelText(/Caption/);
    await userEvent.type(second, "Some draft");
    expect(within(rows[1]).getByText("10/200")).toBeInTheDocument();
    expect(rows[1].querySelector('[id$="-preview"]')).toHaveTextContent("On your profile: Some draft"); // live preview
    await userEvent.click(within(rows[1]).getByRole("button", { name: "Discard" }));
    expect(second).toHaveValue("");

    await userEvent.type(second, "A little memory from my Goa trip.");
    await userEvent.click(within(rows[1]).getByRole("button", { name: "Save caption" }));
    await waitFor(() => expect(onChange).toHaveBeenCalled());
    expect(calls.find((c) => c.key === "PATCH /profiles/me/photos/p2")?.body).toEqual({ caption: "A little memory from my Goa trip." });
    // The first item's existing caption is untouched and can be removed on its own.
    expect(within(rows[0]).getByRole("button", { name: "Remove caption" })).toBeInTheDocument();
  });

  it("reorders, marks the main photo separately, and never offers a video as the main photo", async () => {
    const { calls } = mockApi({ "PUT /profiles/me/photos/order": { body: { data: { ordered: true } } }, "PUT /profiles/me/photos/p2/primary": { body: { data: { primary: "p2" } } } });
    const onChange = vi.fn();
    const { container } = renderWithProviders(<MediaWorkspace media={[item("p1", { isPrimary: true }), item("v1", { kind: "VIDEO", position: 1, durationMs: 12000 }), item("p2", { position: 2 })]} limits={limits} onChange={onChange} />);
    expect(screen.getAllByText("Main photo")).toHaveLength(1);
    expect(screen.getByText("Video · 0:12")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Make main photo" })).toHaveLength(1); // only the other photo, not the video
    await userEvent.click(screen.getByRole("button", { name: "Make main photo" }));
    await waitFor(() => expect(calls.some((c) => c.key === "PUT /profiles/me/photos/p2/primary")).toBe(true));
    await userEvent.click(screen.getByRole("button", { name: "Move 2 earlier" }));
    await waitFor(() => expect(calls.find((c) => c.key === "PUT /profiles/me/photos/order")?.body).toEqual({ ids: ["v1", "p1", "p2"] }));
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("full-profile gallery", () => {
  it("shows every approved photo and video in the owner's order, each with its own caption", () => {
    mockApi({});
    const { container } = renderWithProviders(<EditorialProfile profile={person("u1", "Riya")} onRespond={() => {}} />);
    // Main photo leads; every other item follows in order: the video, then p2, then p3.
    const opens = screen.getAllByRole("button", { name: /^Open (Video|Photo) \d of Riya/ }).map((b) => b.getAttribute("aria-label")!);
    expect(opens.map((l) => l.match(/^Open (\w+ \d)/)![1])).toEqual(["Video 1", "Photo 3", "Photo 4"]);
    expect(screen.getByText("My favourite sunset.")).toBeInTheDocument();
    expect(screen.getByText("Proof that I will always stop to pet a dog.")).toBeInTheDocument();
    expect(screen.getByText("A little memory from my Goa trip.")).toBeInTheDocument();
    expect(screen.getByText("3 photos · 1 video")).toBeInTheDocument();
    // Videos show only their poster until someone asks to play: no <video> element is on the page.
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector('img[src="/api/photos/v1/poster"]')).not.toBeNull();
  });

  it("opens a viewer with a click-to-play video that never autoplays or preloads", async () => {
    mockApi({});
    const { container } = renderWithProviders(<EditorialProfile profile={person("u1", "Riya")} />);
    await userEvent.click(screen.getByRole("button", { name: /^Open Video 1 of Riya/ }));
    expect(screen.getByText("Riya · 1 of 4")).toBeInTheDocument();
    const video = container.querySelector("video")!;
    expect(video).not.toBeNull();
    expect(video.autoplay).toBe(false);
    expect(video.getAttribute("preload")).toBe("none");
    expect(video.hasAttribute("controls")).toBe(true);
    expect(video.getAttribute("poster")).toBe("/api/photos/v1/poster");
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByText("Riya · 2 of 4")).toBeInTheDocument();
    expect(screen.getAllByText("My favourite sunset.").length).toBeGreaterThan(1); // caption shown in the viewer too
  });

  it("lets you like a specific photo or video", async () => {
    mockApi({});
    const onRespond = vi.fn();
    renderWithProviders(<EditorialProfile profile={person("u1", "Riya")} onRespond={onRespond} />);
    await userEvent.click(screen.getByRole("button", { name: "Like this video" }));
    expect(onRespond).toHaveBeenCalledWith(expect.objectContaining({ kind: "MEDIA", ref: "v1", label: "Video", quote: "Proof that I will always stop to pet a dog." }));
  });
});

describe("Discover, one person at a time", () => {
  it("shows one complete profile, then the next person after a pass, without repeats", async () => {
    const asha = person("a1", "Asha", { media: [gallery[1]], photoIds: ["p1"] });
    const bina = person("b2", "Bina", { media: [], photoIds: [] });
    const { calls } = mockApi({
      "GET /auth/me": { body: { data: { id: "me", status: "ACTIVE", onboarded: true, emailVerified: true, role: "USER" } } },
      "GET /profiles/me": { body: { data: { ageMin: 18, ageMax: 60, intentions: ["MARRIAGE"], interests: [] } } },
      "GET /meta/interests": { body: { data: [] } },
      "GET /discovery": { body: { data: { items: [asha, bina], nextCursor: null } } },
      "GET /profiles/a1": { body: { data: asha } },
      "GET /profiles/b2": { body: { data: bina } },
      "POST /likes/pass": { body: { data: { passed: true } } },
    });
    renderWithProviders(
      <Routes>
        <Route path="/app/discover" element={<Discover />} />
      </Routes>,
      { route: "/app/discover" },
    );
    expect(await screen.findByRole("heading", { level: 2, name: /Asha/ })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 2, name: /Bina/ })).toBeNull(); // only one person on screen
    const bar = screen.getByRole("toolbar", { name: "Actions for Asha" });
    expect(within(bar).getByRole("button", { name: "Start with a detail" })).toBeInTheDocument();
    expect(within(bar).getByRole("button", { name: "View compatibility" })).toBeInTheDocument();

    await userEvent.click(within(bar).getByRole("button", { name: "Pass on Asha" }));
    expect(await screen.findByRole("heading", { level: 2, name: /Bina/ })).toBeInTheDocument();
    expect(calls.filter((c) => c.key === "POST /likes/pass")).toEqual([{ key: "POST /likes/pass", body: { userId: "a1" } }]);
    // Bina has no photos: a designed placeholder, not a broken image.
    expect(screen.getByRole("img", { name: "Bina hasn't added a photo yet" })).toBeInTheDocument();

    await userEvent.click(within(screen.getByRole("toolbar", { name: "Actions for Bina" })).getByRole("button", { name: "Pass on Bina" }));
    expect(await screen.findByText("You're all caught up")).toBeInTheDocument();
  });
});
