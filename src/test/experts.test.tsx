import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { RequestItem } from "../pages/app/Experts";
import { renderWithProviders } from "./utils";

const request = { id: "r1", topic: "Communication", question: "How do I say what I need?", sharedFields: [], createdAt: new Date().toISOString() };
const step = (action: string, message: string | null, aiWritten = false) => ({ id: action, action, message, aiWritten, createdAt: new Date().toISOString(), authorId: aiWritten ? null : "e1" });

describe("expert request card", () => {
  it("shows a human expert's advice under their name", () => {
    renderWithProviders(<ul><RequestItem onChange={() => {}} r={{ ...request, status: "COMPLETED", expertName: "Leela Rao", reviews: [step("CLAIMED", null), step("COMPLETED", "Name one need this week.")] }} /></ul>);
    const panel = screen.getByRole("region", { name: "Your review" });
    expect(panel).toHaveTextContent("Expert advice from Leela Rao");
    expect(panel).toHaveTextContent("Name one need this week.");
    expect(screen.getByText(/An expert picked this up/)).toBeInTheDocument();
  });

  it("never presents AI advice as coming from an expert", () => {
    renderWithProviders(<ul><RequestItem onChange={() => {}} r={{ ...request, status: "COMPLETED", expertName: null, reviews: [step("COMPLETED", "Try one small step.", true)] }} /></ul>);
    const panel = screen.getByRole("region", { name: "Your review" });
    expect(panel).toHaveTextContent("Advice from Mavelle AI, not a person");
    expect(panel).not.toHaveTextContent("Expert advice");
  });

  it("shows no advice while a request is still waiting", () => {
    renderWithProviders(<ul><RequestItem onChange={() => {}} r={{ ...request, status: "PENDING", expertName: null, reviews: [] }} /></ul>);
    expect(screen.queryByRole("region", { name: "Your review" })).not.toBeInTheDocument();
    expect(screen.getByText("Waiting for an expert")).toBeInTheDocument();
  });
});
