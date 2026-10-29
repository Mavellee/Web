import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditorialProfile, type EditorialData } from "../components/story/EditorialProfile";
import { DetailComposer } from "../components/story/DetailComposer";
import { PromptWriter } from "../components/story/PromptWriter";
import { StoryPreviewCard } from "../components/story/StoryPreview";
import { sharedSentence } from "../lib/profile";
import { axeViolations, mockApi, renderWithProviders } from "./utils";

const person: EditorialData = {
  id: "u2",
  displayName: "Isha",
  age: 28,
  gender: "WOMAN",
  city: "New Delhi",
  distance: "About 5 km away",
  bio: null,
  languages: ["English", "Hindi"],
  intentions: ["SINGLE"],
  interests: [
    { slug: "hiking", name: "Hiking", shared: true },
    { slug: "coffee", name: "Coffee", shared: true },
    { slug: "pets", name: "Pets", shared: false },
  ],
  sharedInterestCount: 2,
  photoIds: ["a", "b"],
  photos: [
    { id: "a", focusX: 50, focusY: 20 },
    { id: "b", focusX: 50, focusY: 50 },
  ],
  prompts: [
    { key: "ideal_sunday", text: "My ideal Sunday looks like…", answer: "A long drive, coffee and absolutely no plans." },
    { key: "green_flag", text: "A green flag I genuinely appreciate…", answer: "Being kind to dogs." },
  ],
  isDemo: true,
  isApprovedExpert: false,
  compatibility: null,
};

describe("shared interests", () => {
  it("only describes genuine overlaps", () => {
    expect(sharedSentence(person)).toBe("You both enjoy Hiking and Coffee.");
    expect(sharedSentence({ interests: [{ slug: "x", name: "X", shared: false }] })).toBeNull();
  });
});

describe("editorial profile", () => {
  it("presents prompts, photos, shared interests and a demo label, and lets you respond to a detail", async () => {
    mockApi({});
    const onRespond = vi.fn();
    const { container } = renderWithProviders(<EditorialProfile profile={person} onRespond={onRespond} />);
    expect(screen.getByRole("heading", { level: 2, name: /Isha/ })).toHaveTextContent("Isha, 28");
    expect(screen.getByText("Demo profile")).toBeInTheDocument();
    expect(screen.getByText("A long drive, coffee and absolutely no plans.")).toBeInTheDocument();
    expect(screen.getByText("You both enjoy Hiking and Coffee.")).toBeInTheDocument();
    // Every photo is on the page, not only the first.
    expect(screen.getByRole("button", { name: "Open Photo 2 of Isha" })).toBeInTheDocument();
    await userEvent.click(screen.getAllByRole("button", { name: /Respond/ })[0]);
    expect(onRespond).toHaveBeenCalledWith({ kind: "PROMPT", ref: "ideal_sunday", label: "My ideal Sunday looks like…", quote: "A long drive, coffee and absolutely no plans." });
    expect(await axeViolations(container)).toEqual([]);
  });

  it("never invents a score: without enough shared answers it says so and shows only genuine overlaps", () => {
    mockApi({});
    const { unmount } = renderWithProviders(<EditorialProfile profile={person} />);
    expect(screen.getByRole("heading", { name: "Still discovering your compatibility" })).toBeInTheDocument();
    expect(screen.queryByText(/% overlap/)).toBeNull();
    expect(screen.getByText("You both listed")).toBeInTheDocument();
    unmount();
    renderWithProviders(<EditorialProfile profile={{ ...person, compatibility: { version: "v", score: null, confidence: "not_enough_information", dimensions: [], items: [], dealbreakerConflicts: 0, sharedInterests: 0 } }} />);
    expect(screen.getByRole("heading", { name: "Still discovering your compatibility" })).toBeInTheDocument();
  });

  it("explains a calculated score by area, with the full breakdown one tap away", async () => {
    mockApi({});
    const compatibility = {
      version: "2026-10.v1",
      score: 72,
      confidence: "moderate" as const,
      dimensions: [
        { dimension: "RELATIONSHIP_GOALS", score: 100, weight: 5, compared: 1, missing: 0 },
        { dimension: "LIFESTYLE", score: 40, weight: 3, compared: 2, missing: 0 },
      ],
      items: [{ key: "intentions", dimension: "RELATIONSHIP_GOALS", label: "Both open to: Exploring connections", status: "aligned" as const }],
      dealbreakerConflicts: 0,
      sharedInterests: 2,
    };
    renderWithProviders(<EditorialProfile profile={{ ...person, compatibility }} />);
    expect(screen.getByRole("heading", { name: "72% overlap with Isha" })).toBeInTheDocument();
    expect(screen.getByText("Both open to: Exploring connections")).toBeInTheDocument();
    expect(screen.getByText(/can't predict how things will go/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "See compatibility details" }));
    expect(screen.getByRole("heading", { name: "72 / 100 overlap" })).toBeInTheDocument();
  });
});

describe("Start with a detail", () => {
  it("shows the chosen detail and sends the note with the like", async () => {
    mockApi({});
    const onSend = vi.fn(async () => true);
    renderWithProviders(<DetailComposer profile={person as never} detail={{ kind: "PROMPT", ref: "ideal_sunday", label: "My ideal Sunday looks like…", quote: "A long drive." }} onClose={() => {}} onSend={onSend} />);
    expect(screen.getByText("A long drive.")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/Your note/), "Where would you drive?");
    await userEvent.click(screen.getByRole("button", { name: "Send with a like" }));
    expect(onSend).toHaveBeenCalledWith(expect.objectContaining({ ref: "ideal_sunday" }), "Where would you drive?");
  });
});

describe("prompt writer", () => {
  it("writes one prompt at a time and saves through the API", async () => {
    const { calls } = mockApi({
      "GET /meta/prompts": { body: { data: [{ key: "ideal_sunday", text: "My ideal Sunday looks like…", ideas: ["Slow breakfast"] }] } },
      "PUT /profiles/me/prompts": { body: { data: { prompts: [{ key: "ideal_sunday", text: "My ideal Sunday looks like…", answer: "Slow breakfast" }] } } },
    });
    const onSaved = vi.fn();
    renderWithProviders(<PromptWriter answers={[]} onSaved={onSaved} />);
    await userEvent.click(await screen.findByRole("button", { name: "My ideal Sunday looks like…" }));
    await userEvent.click(screen.getByRole("button", { name: "Need an idea?" }));
    await userEvent.click(screen.getByRole("button", { name: "Slow breakfast" }));
    expect(screen.getByLabelText("My ideal Sunday looks like…")).toHaveValue("Slow breakfast");
    await userEvent.click(screen.getByRole("button", { name: "Save answer" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(calls.find((c) => c.key === "PUT /profiles/me/prompts")?.body).toEqual({ prompts: [{ key: "ideal_sunday", answer: "Slow breakfast" }] });
    expect(screen.getByText("On your profile")).toBeInTheDocument();
  });
});

describe("story preview", () => {
  it("clearly marks placeholders before real content exists", () => {
    mockApi({});
    renderWithProviders(<StoryPreviewCard profile={{ ...person, photos: [], photoIds: [], prompts: [] }} />);
    expect(screen.getByText(/Placeholder — your photo goes here/)).toBeInTheDocument();
    expect(screen.getByText(/Your prompt answers will appear here/)).toBeInTheDocument();
  });
});
