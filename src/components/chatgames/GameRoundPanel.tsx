import { useState } from "react";
import { Button } from "../ui/Button";
import { AnswerRevealPanel } from "./AnswerRevealPanel";
import { AnswerSelector } from "./AnswerSelector";
import { ParticipantProgress, partnerOf, promptFor } from "./GamePieces";
import type { GameView, RoundView } from "./types";

type Act = (action: string, body?: object) => Promise<boolean>;

/** The current card: private answering while open, then the shared reveal. */
export function GameRoundPanel({ v, r, act }: { v: GameView; r: RoundView; act: Act }) {
  const prompt = promptFor(v, r);
  const partner = partnerOf(v);
  const me = v.participants.find((p) => p.isYou)!;
  return (
    <section aria-label={`Card ${r.index + 1} of ${v.totalRounds}`} className="space-y-3">
      <p className="font-serif text-xl leading-snug">{prompt}</p>
      {v.rules.mode === "guess" && r.status === "OPEN" && (
        <p className="text-xs text-ink-muted">{r.subjectUserId === me.userId ? `Answer honestly — ${partner?.displayName} will try to guess.` : `${partner?.displayName} is answering about themself. Your guess stays hidden until you both submit.`}</p>
      )}
      <ParticipantProgress v={v} />
      {r.status === "OPEN" &&
        (r.you.answered ? (
          <div className="space-y-2">
            <p role="status" className="rounded-2xl bg-rose-mist px-3 py-2 text-sm text-primary-700">
              Your answer is locked in. Waiting for {partner?.displayName}…
            </p>
            <Button size="sm" variant="quiet" onClick={() => act("skip", { roundIndex: r.index })}>
              Skip this card
            </Button>
          </div>
        ) : (
          <AnswerSelector key={r.index} v={v} r={r} prompt={prompt} onSubmit={(a) => act("answer", { roundIndex: r.index, ...a })} onSkipCard={() => act("skip", { roundIndex: r.index })} />
        ))}
      {r.status === "REVEALED" && (
        <AnswerRevealPanel v={v} r={r} onContinue={() => act("next", { roundIndex: r.index })}>
          {v.rules.notes && r.you.answer && !r.you.answer.skipped && !r.you.answer.note && <NoteForm onSave={(note) => act("note", { roundIndex: r.index, note })} />}
          {v.rules.mode === "guess" && r.subjectUserId === me.userId && r.partner.answer && !r.partner.answer.skipped && r.partner.answer.correct === null && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-parchment-deep/70 p-3">
              <p className="flex-1 text-sm">Did {partner?.displayName} get it?</p>
              <Button size="sm" onClick={() => act("verdict", { roundIndex: r.index, correct: true })}>
                They got it
              </Button>
              <Button size="sm" variant="secondary" onClick={() => act("verdict", { roundIndex: r.index, correct: false })}>
                Not quite
              </Button>
            </div>
          )}
          {v.rules.mode === "guess" && r.partner.answer?.correct !== null && r.subjectUserId === me.userId && (
            <p className="text-center text-xs text-ink-muted">{r.partner.answer?.correct ? `${partner?.displayName} got it right.` : "Not this time."}</p>
          )}
          {v.rules.mode === "guess" && r.subjectUserId !== me.userId && r.you.answer?.correct != null && (
            <p className="text-center text-xs font-semibold text-primary">{r.you.answer.correct ? "You got it right!" : `${partner?.displayName} says not quite.`}</p>
          )}
        </AnswerRevealPanel>
      )}
    </section>
  );
}

function NoteForm({ onSave }: { onSave: (note: string) => Promise<boolean> }) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-primary hover:underline">
        Explain your choice
      </button>
    );
  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        if (await onSave(note)) setOpen(false);
        setBusy(false);
      }}
    >
      <label className="sr-only" htmlFor="game-note">
        Explain your choice
      </label>
      <input id="game-note" value={note} maxLength={280} onChange={(e) => setNote(e.target.value)} placeholder="Because…" className="min-w-0 flex-1 rounded-full border border-line bg-surface px-3.5 py-2 text-sm focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" />
      <Button type="submit" size="sm" loading={busy} disabled={!note.trim()}>
        Share
      </Button>
    </form>
  );
}
