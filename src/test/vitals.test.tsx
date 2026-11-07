import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DealbreakersSection, VitalsSection, heightOption } from "../components/profile/VitalsSections";
import { DetailsChapter } from "../components/story/ProfileChapters";
import type { OwnProfile, PublicProfile, VitalsMeta } from "../lib/types";
import { axeViolations, mockApi, renderWithProviders } from "./utils";

afterEach(() => vi.unstubAllGlobals());

const opts = (...labels: string[]) => labels.map((l) => ({ value: l.toLowerCase().replace(/[^a-z]+/g, "_"), label: l }));
const meta: VitalsMeta = {
  keys: ["height", "jobTitle", "education", "religion", "motherTongue", "diet", "drinking", "smoking", "children", "familyPlans"],
  labels: { height: "Height", jobTitle: "Work", education: "Education", religion: "Religion", motherTongue: "Mother tongue", diet: "Diet", drinking: "Drinking", smoking: "Smoking", children: "Children", familyPlans: "Family plans" },
  choices: {
    education: opts("Bachelors", "Masters"),
    religion: opts("Hindu", "Sikh"),
    motherTongue: opts("Tamil", "Hindi"),
    diet: opts("Vegetarian", "Vegan"),
    drinking: opts("Never", "Socially"),
    smoking: opts("Never", "Regularly"),
    children: opts("None", "Have"),
    familyPlans: opts("Want", "Open"),
  },
  height: { min: 150, max: 200 },
  jobTitleMax: 60,
};
const empty = { heightCm: null, jobTitle: null, education: null, religion: null, motherTongue: null, diet: null, drinking: null, smoking: null, children: null, familyPlans: null };
const profile = { vitals: empty, hiddenVitals: [], dealbreakers: { includeUnstated: true } } as unknown as OwnProfile;

describe("Vitals editor", () => {
  it("saves only what the member chose, with hidden answers marked", async () => {
    const { calls } = mockApi({ "GET /meta/vitals": { body: { data: meta } }, "PATCH /profiles/me": { body: { data: profile } } });
    const onSaved = vi.fn();
    const { container } = renderWithProviders(<VitalsSection profile={profile} onSaved={onSaved} />);
    await userEvent.selectOptions(await screen.findByLabelText("Height"), "170");
    await userEvent.type(screen.getByLabelText("Work"), "  Architect ");
    await userEvent.selectOptions(screen.getByLabelText("Religion"), "sikh");
    await userEvent.click(screen.getByRole("button", { name: "Religion: shown on your profile" }));
    expect(screen.getByRole("button", { name: "Religion: hidden from your profile" })).toHaveAttribute("aria-pressed", "false");
    expect(await axeViolations(container)).toEqual([]);

    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(calls.find((c) => c.key === "PATCH /profiles/me")?.body).toEqual({ ...empty, heightCm: 170, jobTitle: "Architect", religion: "sikh", hiddenVitals: ["religion"] });
  });

  it("labels heights in feet and centimetres", () => {
    expect(heightOption(170)).toBe("5′7″ (170 cm)");
    expect(heightOption(183)).toBe("6′0″ (183 cm)");
  });
});

describe("Dealbreakers", () => {
  it("saves chosen groups, a height range and the unanswered setting", async () => {
    const { calls } = mockApi({ "GET /meta/vitals": { body: { data: meta } }, "PATCH /profiles/me": { body: { data: profile } } });
    const { container } = renderWithProviders(<DealbreakersSection profile={profile} onSaved={() => {}} />);
    const diet = await screen.findByRole("group", { name: "Diet" });
    await userEvent.click(within(diet).getByRole("checkbox", { name: "Vegetarian" }));
    await userEvent.selectOptions(screen.getByLabelText("From"), "165");
    await userEvent.click(screen.getByRole("switch", { name: /Also show people who haven't said/ }));
    expect(screen.getByText(/2 dealbreakers set/)).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);

    await userEvent.click(screen.getByRole("button", { name: "Save dealbreakers" }));
    await waitFor(() => expect(calls.find((c) => c.key === "PATCH /profiles/me")?.body).toEqual({ dealbreakers: { includeUnstated: false, diet: ["vegetarian"], heightMinCm: 165 } }));
  });

  it("refuses a height range that runs backwards", async () => {
    const { calls } = mockApi({ "GET /meta/vitals": { body: { data: meta } } });
    renderWithProviders(<DealbreakersSection profile={profile} onSaved={() => {}} />);
    await userEvent.selectOptions(await screen.findByLabelText("From"), "180");
    await userEvent.selectOptions(screen.getByLabelText("To"), "160");
    expect(screen.getByText("Must be at least the minimum.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Save dealbreakers" }));
    expect(calls.some((c) => c.key === "PATCH /profiles/me")).toBe(false);
  });
});

describe("Public profile details", () => {
  it("lists the vitals the server sent", () => {
    const p = { id: "u1", city: "Chennai", languages: [], zodiac: null, gender: "MAN", interests: [], vitals: [{ key: "height", label: "Height", value: "5′11″ · 180 cm" }, { key: "diet", label: "Diet", value: "Vegetarian" }] } as unknown as PublicProfile;
    render(<DetailsChapter p={p} />);
    expect(screen.getByText("Height").nextSibling).toHaveTextContent("5′11″ · 180 cm");
    expect(screen.getByText("Diet").nextSibling).toHaveTextContent("Vegetarian");
  });
});
