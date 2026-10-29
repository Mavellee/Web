import type { ReactNode } from "react";
import { Icon } from "../ui/Icon";
import { cx } from "../../lib/format";
import { deckStyle } from "../../pages/app/games/decks";
import type { GameView, RoundAnswer, RoundView, SessionStatus } from "./types";

export const partnerOf = (v: GameView) => v.participants.find((p) => !p.isYou);
export const meOf = (v: GameView) => v.participants.find((p) => p.isYou);

/** The prompt as each player should read it ("know each other" topics are personalised). */
export function promptFor(v: GameView, r: RoundView) {
  if (v.rules.mode !== "guess") return r.prompt;
  const me = meOf(v);
  const subject = v.participants.find((p) => p.userId === r.subjectUserId);
  return subject?.userId === me?.userId ? `Your ${r.prompt}` : `Guess ${subject?.displayName ?? "their"}'s ${r.prompt}`;
}

const STATUS_LABEL: Record<SessionStatus, { label: string; cls: string }> = {
  WAITING: { label: "Waiting to start", cls: "bg-gold-soft text-gold-ink" },
  ACTIVE: { label: "In progress", cls: "bg-success-soft text-success" },
  PAUSED: { label: "Paused", cls: "bg-rose-mist text-primary-700" },
  COMPLETED: { label: "Finished", cls: "bg-ink/5 text-ink-soft" },
  CANCELLED: { label: "Ended", cls: "bg-ink/5 text-ink-soft" },
  ENDED: { label: "Ended", cls: "bg-ink/5 text-ink-soft" },
};

export function GameRoundHeader({ v, right }: { v: GameView; right?: ReactNode }) {
  const st = deckStyle(v.game.category);
  const status = STATUS_LABEL[v.status];
  return (
    <header className="flex items-center gap-3">
      <span className={cx("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl", st.surface, st.ink)} aria-hidden="true">
        <Icon name={st.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-serif text-lg leading-tight">{v.game.name}</h3>
        <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink-muted">
          <span className={cx("rounded-full px-2 py-0.5 font-semibold", status.cls)}>{status.label}</span>
          {v.status !== "WAITING" && (
            <span>
              Card {Math.min(v.currentRound + 1, v.totalRounds)} of {v.totalRounds}
            </span>
          )}
        </p>
      </div>
      {right}
    </header>
  );
}

/** Who has answered the current card — without revealing what. */
export function ParticipantProgress({ v }: { v: GameView }) {
  const r = v.round;
  if (!r || r.status !== "OPEN") return null;
  return (
    <ul className="flex flex-wrap gap-2 text-xs" aria-label="Answer progress">
      {v.participants.map((p) => {
        const answered = p.isYou ? r.you.answered : r.partner.answered;
        return (
          <li key={p.userId} className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1", answered ? "bg-primary-50 text-primary-700" : "bg-parchment-deep text-ink-muted")}>
            {answered ? <Icon name="check" className="h-3.5 w-3.5" /> : <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden="true" />}
            {p.isYou ? "You" : p.displayName} {answered ? "answered" : "thinking…"}
          </li>
        );
      })}
    </ul>
  );
}

export function GameReconnectBanner({ v, selfStatus }: { v: GameView; selfStatus: string }) {
  const partner = partnerOf(v);
  if (v.status !== "ACTIVE" && v.status !== "WAITING") return null;
  if (selfStatus === "reconnecting")
    return (
      <p role="status" className="rounded-2xl bg-gold-soft px-3 py-2 text-xs text-gold-ink">
        You're reconnecting. Your answers are saved — the game will catch up automatically.
      </p>
    );
  if (partner && !partner.online)
    return (
      <p role="status" className="rounded-2xl bg-parchment-deep px-3 py-2 text-xs text-ink-soft">
        {partner.displayName} is offline right now. The game is saved — they can pick up where they left off.
      </p>
    );
  return null;
}

export function answerText(a: RoundAnswer | null) {
  if (!a) return null;
  if (a.skipped) return <em className="text-ink-muted">Passed</em>;
  return a.choice ?? a.text;
}

export function agreementLabel(v: GameView, agreed: boolean) {
  // Loyalty & Boundaries is about perspectives, not right answers.
  if (v.game.category === "LOYALTY_BOUNDARIES") return agreed ? "Same view" : "Different views — worth a conversation";
  return agreed ? "You agreed" : "You see this differently";
}

