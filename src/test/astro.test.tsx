import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { KnotAstro } from "../pages/app/KnotAstro";
import { axeViolations, mockApi, renderWithProviders } from "./utils";

const M = "/astro/matches/m1";
const base = { available: true, configured: true, eligible: true, conversationId: "c1", status: "NOT_STARTED", failure: null, myState: null, theirState: null, hasSavedBirth: false, hasReport: false, canRetry: false };
const common = {
  "GET /auth/me": { body: { data: { id: "u1", email: "a@knot.test", role: "USER", status: "ACTIVE" } } },
  "GET /profiles/me": { body: { data: { dateOfBirth: "1995-06-15" } } },
  "GET /astro/places": { body: { data: [{ id: "in-pune", city: "Pune", region: "Maharashtra", country: "India" }] } },
};
const show = () => renderWithProviders(
  <Routes>
    <Route path="/app/astro/:matchId" element={<KnotAstro />} />
  </Routes>,
  { route: "/app/astro/m1" },
);
const chart = (name: string) => ({ name, sun: "Mithuna", moon: "Karka", nakshatra: "Pushya", pada: 2, lagna: null, accuracy: "UNKNOWN", unavailable: [{ field: "Lagna and houses", reason: "These need a birth time." }] });
const report = { status: "READY", failure: null, conversationId: "c1", version: "knot-vedic-1", me: chart("Asha"), them: chart("Vikram"), guna: { method: "ashtakoota-north-1", total: 24.5, max: 36, kootas: [{ key: "nadi", label: "Nadi", meaning: "Constitution", score: 8, max: 8 }] }, gunaUnavailableReason: null, themes: ["Both Moons are in water signs."], interpretationMine: "personA", model: "m", interpretation: { overview: "A warm start.", chartInsights: { personA: "Asha may value calm.", personB: "Vikram may value clarity." }, emotionalConnection: "Shared ground.", communication: "Talk it through.", attraction: "Worth exploring.", harmony: ["Water signs."], differences: ["Different Suns."], reflectionPrompts: ["What feels like home?"], narrative: "A story being written.", starters: ["What makes you feel understood?", "What does home mean?", "Where next?"] } };

describe("Knot Astro", () => {
  it("offers the invitation with both choices, and says it's optional", async () => {
    mockApi({ ...common, [`GET ${M}`]: { body: { data: base } } });
    const { container } = show();
    expect(await screen.findByRole("button", { name: "Explore Our Compatibility" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Skip and Start Chatting" })).toBeInTheDocument();
    expect(screen.getByText(/You've found a connection/)).toBeInTheDocument();
    expect(await axeViolations(container)).toEqual([]);
  });

  it("isn't offered when the match isn't eligible, and points back to chat", async () => {
    mockApi({ ...common, [`GET ${M}`]: { body: { data: { available: false } } } });
    show();
    expect(await screen.findByText("Knot Astro isn't part of this match.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Explore Our Compatibility" })).not.toBeInTheDocument();
  });

  it("needs explicit consent, hides the time when unknown, and explains the effect", async () => {
    const { calls } = mockApi({ ...common, [`GET ${M}`]: { body: { data: { ...base, status: "COLLECTING", myState: "INTERESTED" } } }, [`POST ${M}/consent`]: { body: { data: { ...base, status: "COLLECTING", myState: "CONSENTED" } } } });
    show();
    const send = await screen.findByRole("button", { name: "Send to Knot Astro" });
    expect(send).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "I don't know" }));
    expect(screen.queryByLabelText("Birth time")).not.toBeInTheDocument();
    expect(screen.getByText(/We never guess a time/)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("option", { name: /Pune/ })).toBeInTheDocument());
    await userEvent.selectOptions(screen.getByLabelText(/City of birth/), "in-pune");
    await userEvent.click(screen.getByRole("checkbox", { name: /Calculate my chart/ }));
    await waitFor(() => expect(send).toBeEnabled());
    await userEvent.click(send);
    await screen.findByText("Yours is in.");
    expect(calls.find((c) => c.key === `POST ${M}/consent`)?.body).toEqual({ birth: { date: "1995-06-15", time: null, accuracy: "UNKNOWN", placeId: "in-pune" }, shareSummary: true, externalAi: false, useInterests: false });
  });

  it("only shows the working state while the server reports work", async () => {
    mockApi({ ...common, [`GET ${M}`]: { body: { data: { ...base, status: "CALCULATING", myState: "CONSENTED", theirState: "CONSENTED" } } } });
    show();
    expect(await screen.findByText("Your charts are being explored…")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Calculating both charts");
  });

  it("renders the full report with what's missing, and never a percentage", async () => {
    mockApi({ ...common, [`GET ${M}`]: { body: { data: { ...base, status: "READY", myState: "CONSENTED", theirState: "CONSENTED", hasReport: true } } }, [`GET ${M}/report`]: { body: { data: report } } });
    const { container } = show();
    expect(await screen.findByRole("heading", { name: "Your Cosmic Connection" })).toBeInTheDocument();
    expect(screen.getByText("Asha may value calm.")).toBeInTheDocument();
    expect(screen.getByText(/not a scientific assessment/)).toBeInTheDocument();
    expect(screen.getAllByText(/Lagna and houses/)).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Start Your Conversation" })).toHaveAttribute("href", "/app/messages/c1");
    expect(container.textContent).not.toMatch(/\d\s?%/);
    expect(await axeViolations(container)).toEqual([]);
  });

  it("shows the calculated report and a retry when the reading failed", async () => {
    mockApi({ ...common, [`GET ${M}`]: { body: { data: { ...base, status: "PARTIAL", failure: "FAILED", myState: "CONSENTED", theirState: "CONSENTED", hasReport: true, canRetry: true } } }, [`GET ${M}/report`]: { body: { data: { ...report, status: "PARTIAL", failure: "FAILED", interpretation: null, model: null } } } });
    show();
    expect(await screen.findByRole("button", { name: "Try the reading again" })).toBeInTheDocument();
    expect(screen.getByText("Guna Milan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start Your Conversation" })).toBeInTheDocument();
  });
});
