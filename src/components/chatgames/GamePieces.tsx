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

export function GameProgressIndicator({ v }: { v: GameView }) {
  const finished = v.history.map((h) => h.index);
  return (
    <ol className="flex gap-1" aria-label={`${finished.length} of ${v.totalRounds} cards played`}>
      {Array.from({ length: v.totalRounds }, (_, i) => {
        const done = finished.includes(i);
        const current = i === v.currentRound && (v.status === "ACTIVE" || v.status === "PAUSED") && !done;
        return <li key={i} className={cx("h-1 flex-1 rounded-full transition-colors duration-500", done ? "bg-primary" : current ? "bg-primary-300" : "bg-parchment-deep")} />;
      })}
    </ol>
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
          <li key={p.userId} className={cx("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1", answered ? "bg-success-soft text-success" : "bg-parchment-deep text-ink-muted")}>
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

function answerText(a: RoundAnswer | null) {
  if (!a) return null;
  if (a.skipped) return <em className="text-ink-muted">Passed</em>;
  return a.choice ?? a.text;
}

export function agreementLabel(v: GameView, agreed: boolean) {
  // Loyalty & Boundaries is about perspectives, not right answers.
  if (v.game.category === "LOYALTY_BOUNDARIES") return agreed ? "Same view" : "Different views — worth a conversation";
  return agreed ? "You agreed" : "You see this differently";
}

export function AnswerReveal({ v, r }: { v: GameView; r: RoundView }) {
  const partner = partnerOf(v);
  const cells: [string, RoundAnswer | null][] = [
    ["You", r.you.answer],
    [partner?.displayName ?? "Partner", r.partner.answer],
  ];
  return (
    <div className="space-y-2" aria-live="polite">
      <div className="grid grid-cols-2 gap-2">
        {cells.map(([who, a], i) => (
          <div key={who} className="animate-rise rounded-2xl border hairline bg-surface p-3" style={{ animationDelay: `${i * 90}ms` }}>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">{who}</p>
            <p className="mt-1 break-words text-[0.95rem]">{answerText(a)}</p>
            {a?.note && <p className="mt-1.5 border-l-2 border-primary-200 pl-2 text-xs text-ink-soft">{a.note}</p>}
          </div>
        ))}
      </div>
      {r.agreed !== null && <p className={cx("text-center text-xs font-semibold", r.agreed ? "text-success" : "text-primary-700")}>{agreementLabel(v, r.agreed)}</p>}
    </div>
  );
}

/** Final or early-end summary, posted as its own timeline card. */
export function GameResultSummary({ metadata, v }: { metadata: Record<string, unknown>; v?: GameView }) {
  const event = metadata.event as string;
  const name = (metadata.game as string) ?? v?.game.name ?? "Game";
  const by = v?.participants.find((p) => p.userId === metadata.byUserId);
  const agreements = metadata.agreements as number | null;
  const comparable = metadata.comparableRounds as number | null;
  const correct = metadata.correct as Record<string, number> | null;
  const revealed = metadata.revealedRounds as number;
  const lines: string[] = [];
  if (agreements !== null && comparable) lines.push(`You agreed on ${agreements} out of ${comparable} card${comparable === 1 ? "" : "s"}.`);
  if (correct && v) for (const p of v.participants) lines.push(`${p.isYou ? "You" : p.displayName} guessed ${correct[p.userId] ?? 0} right.`);
  if (!lines.length && revealed) lines.push(`${revealed} card${revealed === 1 ? "" : "s"} answered together.`);

  const title = event === "completed" ? `${name} finished` : event === "declined" ? `${by?.isYou ? "You" : (by?.displayName ?? "Your match")} passed on ${name}` : `${name} ended${by ? ` by ${by.isYou ? "you" : by.displayName}` : ""}`;
  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border hairline bg-surface/90 px-4 py-3 text-center">
      <p className="text-sm font-semibold">{title}</p>
      {lines.map((l) => (
        <p key={l} className="text-sm text-ink-soft">
          {l}
        </p>
      ))}
      {event === "completed" && <p className="mt-1 text-xs text-ink-muted">Keep talking about anything that surprised you.</p>}
    </div>
  );
}
