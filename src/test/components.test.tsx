import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileCard } from "../components/profile/ProfileCard";
import { QuestionCard } from "../components/compat/QuestionCard";
import { Landing } from "../pages/public/Landing";
import type { PublicProfile } from "../lib/types";
import { axeViolations, mockApi, renderWithProviders } from "./utils";

const profile: PublicProfile = {
  id: "p1",
  displayName: "Meher",
  age: 27,
  gender: "WOMAN",
  city: "Noida",
  distance: "About 15 km away",
  bio: "Tea snob and collector of bad puns.",
  languages: ["English"],
  intentions: ["SINGLE"],
  interests: [
    { slug: "tea", name: "Tea", shared: true },
    { slug: "films", name: "Films", shared: false },
  ],
  sharedInterestCount: 1,
  photoIds: ["ph1", "ph2"],
  isApprovedExpert: false,
  compatibility: { score: 82, confidence: "moderate", highlights: ["Aligned on communication"], dealbreakerConflicts: 1 },
};

describe("ProfileCard", () => {
  it("shows the facts people decide on, marks shared interests and flags dealbreakers", () => {
    mockApi({});
    renderWithProviders(<ProfileCard profile={profile} />);
    expect(screen.getByRole("heading", { name: /Meher/ })).toHaveTextContent("Meher, 27");
    expect(screen.getByText(/About 15 km away/)).toBeInTheDocument();
    expect(screen.getByText("Exploring")).toBeInTheDocument();
    expect(screen.getByText("(shared interest)", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("82")).toBeInTheDocument();
    expect(screen.getByText(/conflicts with a dealbreaker/)).toBeInTheDocument();
  });

  it("lets keyboard users step through photos", async () => {
    mockApi({});
    renderWithProviders(<ProfileCard profile={profile} />);
    expect(screen.getByAltText("Photo 1 of Meher")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Next photo" }));
    expect(screen.getByAltText("Photo 2 of Meher")).toBeInTheDocument();
  });

  it("has no detectable accessibility violations", async () => {
    mockApi({});
    const { container } = renderWithProviders(<ProfileCard profile={profile} />);
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("QuestionCard", () => {
  const q = {
    id: "q1",
    key: "smoking",
    dimension: "LIFESTYLE",
    prompt: "Do you smoke?",
    options: [
      { value: "never", label: "Never" },
      { value: "sometimes", label: "Sometimes" },
    ],
    myAnswer: null,
  };

  it("only allows a dealbreaker once acceptable answers are chosen, then saves", async () => {
    const { calls } = mockApi({ "PUT /compatibility/answers/q1": { body: { data: { answer: "never", acceptable: ["never"], importance: 1, isDealbreaker: true } } } });
    renderWithProviders(<QuestionCard q={q} />);
    await userEvent.click(screen.getByRole("radio", { name: /Never/ }));
    const dealbreaker = screen.getByLabelText(/dealbreaker/);
    expect(dealbreaker).toBeDisabled();
    const acceptable = screen.getAllByRole("checkbox", { name: /Never/ })[0];
    await userEvent.click(acceptable);
    expect(dealbreaker).toBeEnabled();
    await userEvent.click(dealbreaker);
    await userEvent.click(screen.getByRole("button", { name: "Save answer" }));
    expect(calls.find((c) => c.key === "PUT /compatibility/answers/q1")?.body).toMatchObject({ answer: "never", acceptable: ["never"], isDealbreaker: true });
  });
});

describe("Landing page", () => {
  it("covers the required sections, uses the new hero copy and labels illustrations honestly", async () => {
    mockApi({});
    const { container } = renderWithProviders(<Landing />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Not just a match.A connection that makes sense.");
    for (const cta of screen.getAllByRole("link", { name: "Find your connection" })) expect(cta).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("link", { name: "Discover how Mavelle works" })).toHaveAttribute("href", "/how-it-works");
    for (const name of [/Every kind of connection is valid/, /From first impression/, /thoughtful second opinion/, /Better questions/, /You stay in control/, /Start with what you're looking for/]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    // Each intention card links to its explanation, and none is presented as better than another.
    for (const slug of ["single", "situationship", "marriage"]) expect(container.querySelector(`a[href="/intentions#${slug}"]`)).not.toBeNull();
    expect(screen.getByText(/not real members/)).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });
});
