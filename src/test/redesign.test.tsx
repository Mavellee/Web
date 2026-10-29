import { describe, expect, it } from "vitest";
import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Tabs } from "../components/ui/Tabs";
import { completionItems } from "../components/profile/Completion";
import { DiscoverFilters, filtersFromParams, filtersToQuery, EMPTY_FILTERS, type Filters } from "../pages/app/discover/DiscoverFilters";
import { SharedDataView } from "../components/experts/SharedDataView";
import type { OwnProfile } from "../lib/types";
import { axeViolations } from "./utils";

const me: OwnProfile = {
  age: 29,
  displayName: "Aanya",
  gender: "WOMAN",
  interestedIn: ["MAN"],
  bio: "",
  city: "New Delhi",
  hasApproxLocation: false,
  languages: [],
  interests: ["coffee", "hiking"],
  intentions: ["MARRIAGE", "SINGLE"],
  soughtIntentions: [],
  ageMin: 24,
  ageMax: 38,
  maxDistanceKm: 60,
  isPublished: true,
  isDiscoverable: true,
  discoveryPaused: false,
  photos: [{ id: "p1", position: 0, status: "APPROVED" }],
};

describe("Tabs", () => {
  function Harness() {
    const [v, setV] = useState("a");
    return (
      <Tabs
        label="Sections"
        value={v}
        onChange={setV}
        tabs={[
          { value: "a", label: "First" },
          { value: "b", label: "Second" },
        ]}
      />
    );
  }
  it("supports arrow-key navigation with roving focus", async () => {
    render(<Harness />);
    const first = screen.getByRole("tab", { name: "First" });
    first.focus();
    await userEvent.keyboard("{ArrowRight}");
    const second = screen.getByRole("tab", { name: "Second" });
    expect(second).toHaveAttribute("aria-selected", "true");
    expect(second).toHaveFocus();
    expect(first).toHaveAttribute("tabindex", "-1");
  });
});

describe("Profile completion", () => {
  it("is computed only from saved data", () => {
    const items = completionItems(me, 1);
    const done = Object.fromEntries(items.map((i) => [i.key, i.done]));
    expect(done).toMatchObject({ photo: true, photos3: false, bio: false, interests: false, languages: false, city: true, intentions: true, questions: false });
    // Without question data, that item is left out rather than guessed.
    expect(completionItems(me, null).some((i) => i.key === "questions")).toBe(false);
  });
});

describe("Discover filters", () => {
  it("round-trips through the URL", () => {
    const f: Filters = { intentions: ["MARRIAGE"], interests: ["coffee"], ageMin: 28, ageMax: 34, maxDistanceKm: 25 };
    expect(filtersFromParams(filtersToQuery(f))).toEqual(f);
    expect(filtersToQuery(EMPTY_FILTERS).toString()).toBe("");
  });

  it("only offers options within saved preferences and applies the selection", async () => {
    let applied: Filters | null = null;
    const { container } = render(<DiscoverFilters me={me} value={EMPTY_FILTERS} onApply={(f) => (applied = f)} interestNames={new Map([["coffee", "Coffee"], ["hiking", "Hiking"]])} />);
    // Intentions outside "what I'm open to" (Casual) are not offered.
    expect(screen.queryByRole("checkbox", { name: /Casual/ })).toBeNull();
    // Distances can only be tighter than the saved 60 km.
    expect(screen.queryByRole("option", { name: "Within 100 km" })).toBeNull();
    await userEvent.click(screen.getByRole("checkbox", { name: /Long-term commitment/ }));
    await userEvent.click(screen.getByRole("checkbox", { name: /Coffee/ }));
    await userEvent.selectOptions(screen.getByLabelText("Location"), "25");
    await userEvent.click(screen.getByRole("button", { name: "Show results" }));
    expect(applied).toEqual({ intentions: ["MARRIAGE"], interests: ["coffee"], maxDistanceKm: 25 });
    expect(await axeViolations(container)).toEqual([]);
  });
});

describe("Expert shared data", () => {
  it("shows only consented sections and says when nothing extra was shared", () => {
    const { rerender } = render(<SharedDataView fields={[]} data={{}} />);
    expect(screen.getByText(/shared only their question/)).toBeInTheDocument();
    rerender(<SharedDataView fields={["intentions"]} data={{ intentions: { own: ["MARRIAGE"], sought: [] } }} />);
    expect(screen.getByText("Relationship intentions")).toBeInTheDocument();
    expect(screen.queryByText("Profile summary")).toBeNull();
    expect(screen.queryByText(/Compatibility answers/)).toBeNull();
  });
});
