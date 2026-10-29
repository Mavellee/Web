import { describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameSessionPanel } from "../components/chatgames/InlineGameCard";
import { GameSelectionSheet } from "../components/chatgames/GameSelectionSheet";
import type { GameView } from "../components/chatgames/types";
import type { ConversationGames } from "../components/chatgames/useConversationGames";
import { axeViolations, mockApi, renderWithProviders } from "./utils";

const base = (over: Partial<GameView> = {}): GameView => ({
  id: "s1",
  conversationId: "c1",
  game: { slug: "red-flag-green-flag", name: "Red Flag or Green Flag?", category: "RED_FLAG_GREEN_FLAG", description: "" },
  rules: { mode: "simultaneous", answer: "choice", agreement: true, notes: true },
  status: "ACTIVE",
  version: 3,
  totalRounds: 5,
  currentRound: 0,
  startedById: "me",
  endedById: null,
  participants: [
    { userId: "me", displayName: "Asha", isYou: true, joined: true, online: true },
    { userId: "them", displayName: "Bilal", isYou: false, joined: true, online: true },
  ],
  round: {
    index: 0,
    status: "OPEN",
    prompt: "They remember a small detail you mentioned weeks ago.",
    theme: "Effort and emotional availability",
    discussion: null,
    options: ["Red Flag", "Green Flag", "It Depends"],
    subjectUserId: null,
    you: { answered: false, answer: null },
    partner: { answered: true, answer: null },
    agreed: null,
  },
  history: [],
  summary: { revealedRounds: 0, skippedRounds: 0, comparableRounds: 0, agreements: 0, correct: null },
  ...over,
});

const gamesWith = (act = vi.fn(async () => true)) => ({ sessions: {}, live: null, loaded: true, error: null, start: vi.fn(), act, refresh: vi.fn() }) as unknown as ConversationGames;

describe("in-chat game card", () => {
  it("submits a private choice for the current round and never shows the partner's pending answer", async () => {
    mockApi({});
    const act = vi.fn(async () => true);
    const { container } = renderWithProviders(<GameSessionPanel v={base()} games={gamesWith(act)} />);
    expect(screen.getByText("Bilal answered")).toBeInTheDocument();
    expect(screen.getByText(/Hidden from Bilal until you've both answered/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("radio", { name: /Green Flag/ }));
    await userEvent.click(screen.getByRole("button", { name: "Lock in answer" }));
    expect(act).toHaveBeenCalledWith("s1", "answer", { roundIndex: 0, choice: "Green Flag" });
    // Skipping is round-level only; there is no per-player "pass" that could trigger a reveal.
    expect(screen.queryByRole("button", { name: /pass/i })).toBeNull();
    await userEvent.click(screen.getByRole("button", { name: "Skip this card" }));
    expect(act).toHaveBeenCalledWith("s1", "skip", { roundIndex: 0 });
    expect(await axeViolations(container)).toEqual([]);
  });

  it("reveals both answers with neutral agreement wording and offers the next card", async () => {
    mockApi({});
    const act = vi.fn(async () => true);
    const revealed = base({
      round: { ...base().round!, status: "REVEALED", discussion: "What small gestures make you each feel noticed?", you: { answered: true, answer: { choice: "Green Flag", text: null, skipped: false, note: null, correct: null } }, partner: { answered: true, answer: { choice: "It Depends", text: null, skipped: false, note: "Feels intense", correct: null } }, agreed: false },
    });
    renderWithProviders(<GameSessionPanel v={revealed} games={gamesWith(act)} />);
    expect(screen.getByText("It Depends")).toBeInTheDocument();
    expect(screen.getByText("What small gestures make you each feel noticed?")).toBeInTheDocument();
    expect(screen.getByText("Feels intense")).toBeInTheDocument();
    expect(screen.getByText("You see this differently")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Next scenario/ }));
    expect(act).toHaveBeenCalledWith("s1", "next", { roundIndex: 0 });
  });

  it("lets the invited partner join or decline, and shows a waiting state to the starter", async () => {
    mockApi({});
    const act = vi.fn(async () => true);
    const invited = base({ status: "WAITING", round: null, participants: [{ ...base().participants[0], joined: false }, base().participants[1]] });
    const { unmount } = renderWithProviders(<GameSessionPanel v={invited} games={gamesWith(act)} />);
    await userEvent.click(screen.getByRole("button", { name: "Join game" }));
    expect(act).toHaveBeenCalledWith("s1", "join", {});
    unmount();
    renderWithProviders(<GameSessionPanel v={base({ status: "WAITING", round: null })} games={gamesWith()} />);
    expect(screen.getByText(/Waiting for Bilal to join/)).toBeInTheDocument();
  });

  it("shows a reconnecting notice when the partner is offline, and personalises guessing prompts", () => {
    mockApi({});
    const v = base({
      rules: { mode: "guess", answer: "text", agreement: false, notes: false },
      participants: [base().participants[0], { ...base().participants[1], online: false }],
      round: { ...base().round!, prompt: "go-to comfort food", options: null, subjectUserId: "them" },
    });
    renderWithProviders(<GameSessionPanel v={v} games={gamesWith()} />);
    expect(screen.getByText(/Bilal is offline right now/)).toBeInTheDocument();
    expect(screen.getAllByText("Guess Bilal's go-to comfort food").length).toBeGreaterThan(0);
    expect(screen.getByLabelText("Guess Bilal's go-to comfort food")).toHaveAttribute("placeholder", "Your best guess…");
  });

  it("asks for confirmation before ending a game", async () => {
    mockApi({});
    const act = vi.fn(async () => true);
    renderWithProviders(<GameSessionPanel v={base()} games={gamesWith(act)} />);
    await userEvent.click(screen.getByRole("button", { name: "End game" }));
    expect(act).not.toHaveBeenCalled();
    const buttons = screen.getAllByRole("button", { name: "End game" });
    await userEvent.click(buttons[buttons.length - 1]);
    expect(act).toHaveBeenCalledWith("s1", "end", {});
  });
});

describe("game launcher sheet", () => {
  it("loads the catalogue and starts the chosen game", async () => {
    mockApi({
      "GET /games/catalog": {
        body: {
          data: [{ slug: "deep-questions", name: "Deep Questions", description: "Slow and thoughtful.", category: "DEEP_QUESTIONS", players: 2, minutes: 15, rounds: 4, mode: "simultaneous", answer: "text", preview: { prompt: "When do you feel most like yourself?", options: null } }],
        },
      },
    });
    const onStart = vi.fn(async () => true);
    renderWithProviders(<GameSelectionSheet open onClose={() => {}} onStart={onStart} partnerName="Bilal" />);
    expect(await screen.findByText("Deep Questions")).toBeInTheDocument();
    expect(screen.getByText(/2 players · about 15 min · 4 cards/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Start game" }));
    await waitFor(() => expect(onStart).toHaveBeenCalledWith("deep-questions"));
  });
});
