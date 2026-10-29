export type SessionStatus = "WAITING" | "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED" | "ENDED";

export interface RoundAnswer {
  choice: string | null;
  text: string | null;
  skipped: boolean;
  note: string | null;
  correct: boolean | null;
}

export interface RoundView {
  index: number;
  status: "OPEN" | "REVEALED" | "SKIPPED";
  prompt: string;
  options: string[] | null;
  subjectUserId: string | null;
  you: { answered: boolean; answer: RoundAnswer | null };
  partner: { answered: boolean; answer: RoundAnswer | null };
  agreed: boolean | null;
}

export interface GameView {
  id: string;
  conversationId: string;
  game: { slug: string; name: string; category: string; description: string };
  rules: { mode: "simultaneous" | "guess"; answer: "choice" | "text"; agreement: boolean; notes: boolean };
  status: SessionStatus;
  version: number;
  totalRounds: number;
  currentRound: number;
  startedById: string;
  endedById: string | null;
  participants: { userId: string; displayName: string; isYou: boolean; joined: boolean; online: boolean }[];
  round: RoundView | null;
  history: RoundView[];
  summary: { revealedRounds: number; skippedRounds: number; comparableRounds: number | null; agreements: number | null; correct: Record<string, number> | null };
}

export interface CatalogGame {
  slug: string;
  name: string;
  description: string;
  category: string;
  players: number;
  minutes: number;
  rounds: number;
  mode: "simultaneous" | "guess";
  answer: "choice" | "text";
  preview: { prompt: string; options: string[] | null } | null;
}

export const LIVE: SessionStatus[] = ["WAITING", "ACTIVE", "PAUSED"];
export const isLive = (s: { status: SessionStatus }) => LIVE.includes(s.status);
