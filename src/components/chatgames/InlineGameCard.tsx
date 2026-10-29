import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Icon } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";
import { useSocket } from "../../lib/socket";
import type { Message } from "../../lib/types";
import { cx } from "../../lib/format";
import { AnswerReveal, GameProgressIndicator, GameReconnectBanner, GameResultSummary, GameRoundHeader, ParticipantProgress, partnerOf, promptFor } from "./GamePieces";
import { PrivateAnswerForm } from "./PrivateAnswerForm";
import { isLive, type GameView, type RoundView } from "./types";
import type { ConversationGames } from "./useConversationGames";

/** A game event in the conversation timeline: the live game card, or a finished-game summary. */
export function InlineGameCard({ message, games }: { message: Message; games: ConversationGames }) {
  const v = message.gameSessionId ? games.sessions[message.gameSessionId] : undefined;
  const event = (message.metadata?.event as string) ?? "started";

  if (event !== "started") {
    return (
      <div className="py-2">
        <GameResultSummary metadata={message.metadata ?? {}} v={v} />
      </div>
    );
  }
  if (!v) {
    return games.loaded ? (
      <p className="py-2 text-center text-xs text-ink-muted">This game is no longer available.</p>
    ) : (
      <Skeleton className="mx-auto h-40 w-full max-w-md rounded-3xl" />
    );
  }
  return <GameSessionPanel v={v} games={games} />;
}

export function GameSessionPanel({ v, games }: { v: GameView; games: ConversationGames }) {
  const live = isLive(v);
  const [expanded, setExpanded] = useState(live);
  // When a game finishes, fold it into a compact, read-only history card.
  useEffect(() => {
    if (!live) setExpanded(false);
  }, [live]);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const { status: socketStatus } = useSocket();
  const partner = partnerOf(v);
  const me = v.participants.find((p) => p.isYou)!;
  const act = (action: string, body: object = {}) => games.act(v.id, action, body);

  return (
    <article id={`game-card-${v.id}`} aria-label={`${v.game.name} game`} className={cx("mx-auto my-3 w-full max-w-md rounded-[1.75rem] border bg-white/95 p-4 shadow-soft transition", live ? "border-plum/25" : "hairline")}>
      <GameRoundHeader
        v={v}
        right={
          !live && (
            <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className="rounded-full px-3 py-1.5 text-xs font-semibold text-plum hover:bg-plum-50">
              {expanded ? "Hide" : "View cards"}
            </button>
          )
        }
      />

      {(live || expanded) && (
        <div className="mt-4 space-y-4">
          {v.status !== "WAITING" && <GameProgressIndicator v={v} />}
          <GameReconnectBanner v={v} selfStatus={socketStatus} />

          {v.status === "WAITING" &&
            (me.joined ? (
              <div className="space-y-3">
                <p className="text-sm text-ink-soft">Waiting for {partner?.displayName} to join. They've been invited.</p>
                <Button size="sm" variant="quiet" onClick={() => setConfirmEnd(true)}>
                  Cancel invitation
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-ink-soft">{partner?.displayName} invited you to play. It's optional — join whenever you like.</p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => act("join")}>
                    Join game
                  </Button>
                  <Button size="sm" variant="quiet" onClick={() => act("end")}>
                    Not now
                  </Button>
                </div>
              </div>
            ))}

          {v.status === "PAUSED" && (
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-lavender-soft/70 p-3">
              <p className="text-sm text-plum-700">The game is paused.</p>
              <Button size="sm" onClick={() => act("resume")}>
                Resume
              </Button>
            </div>
          )}

          {v.status === "ACTIVE" && v.round && <CurrentRound v={v} r={v.round} act={act} />}

          {!live && expanded && <History v={v} />}

          {live && v.status !== "WAITING" && (
            <footer className="flex justify-end gap-1 border-t hairline pt-3">
              {v.status === "ACTIVE" && (
                <Button size="sm" variant="quiet" onClick={() => act("pause")}>
                  Pause
                </Button>
              )}
              <Button size="sm" variant="quiet" className="text-rose-ink" onClick={() => setConfirmEnd(true)}>
                End game
              </Button>
            </footer>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        title={v.status === "WAITING" ? "Cancel this invitation?" : "End this game?"}
        body={`${partner?.displayName ?? "Your match"} will see that the game has ended. Ended games can't be restarted, but you can always start a new one.`}
        confirmLabel={v.status === "WAITING" ? "Cancel invitation" : "End game"}
        onConfirm={async () => {
          await act("end");
        }}
        danger
      />
    </article>
  );
}

function CurrentRound({ v, r, act }: { v: GameView; r: RoundView; act: (a: string, b?: object) => Promise<boolean> }) {
  const prompt = promptFor(v, r);
  const partner = partnerOf(v);
  const me = v.participants.find((p) => p.isYou)!;
  return (
    <section aria-label={`Card ${r.index + 1}`} className="space-y-3">
      <p className="font-serif text-xl leading-snug">{prompt}</p>
      {v.rules.mode === "guess" && r.status === "OPEN" && (
        <p className="text-xs text-ink-muted">{r.subjectUserId === me.userId ? `Answer honestly — ${partner?.displayName} will try to guess.` : `${partner?.displayName} is answering about themself. Your guess stays hidden until you both submit.`}</p>
      )}
      <ParticipantProgress v={v} />
      {r.status === "OPEN" &&
        (r.you.answered ? (
          <p className="rounded-2xl bg-sage/60 px-3 py-2 text-sm text-sage-ink">Your answer is locked in. Waiting for {partner?.displayName}…</p>
        ) : (
          <PrivateAnswerForm
            key={r.index}
            v={v}
            r={r}
            prompt={prompt}
            onSubmit={(a) => act("answer", { roundIndex: r.index, ...a })}
            onPass={() => act("answer", { roundIndex: r.index, skip: true })}
            onSkipCard={() => act("skip", { roundIndex: r.index })}
          />
        ))}
      {r.status === "REVEALED" && (
        <>
          <AnswerReveal v={v} r={r} />
          {v.rules.notes && r.you.answer && !r.you.answer.skipped && !r.you.answer.note && <NoteForm onSave={(note) => act("note", { roundIndex: r.index, note })} />}
          {v.rules.mode === "guess" && r.subjectUserId === me.userId && r.partner.answer && !r.partner.answer.skipped && r.partner.answer.correct === null && (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-ivory-deep/70 p-3">
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
            <p className="text-center text-xs font-semibold text-sage-ink">{r.you.answer.correct ? "You got it right!" : `${partner?.displayName} says not quite.`}</p>
          )}
          <Button size="sm" className="w-full" onClick={() => act("next", { roundIndex: r.index })} icon={<Icon name="arrow" className="h-4 w-4" />}>
            {v.currentRound + 1 >= v.totalRounds ? "See the summary" : "Next card"}
          </Button>
        </>
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
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-semibold text-plum hover:underline">
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
      <input id="game-note" value={note} maxLength={280} onChange={(e) => setNote(e.target.value)} placeholder="Because…" className="min-w-0 flex-1 rounded-full border border-[#E4D8CD] bg-white px-3.5 py-2 text-sm focus:border-plum focus:outline-none focus:ring-4 focus:ring-plum/10" />
      <Button type="submit" size="sm" loading={busy} disabled={!note.trim()}>
        Share
      </Button>
    </form>
  );
}

function History({ v }: { v: GameView }) {
  if (!v.history.length) return <p className="text-sm text-ink-muted">No cards were played.</p>;
  return (
    <ol className="space-y-3">
      {v.history.map((r) => (
        <li key={r.index} className="space-y-2 border-t hairline pt-3 first:border-0 first:pt-0">
          <p className="text-sm font-semibold">{promptFor(v, r)}</p>
          {r.status === "SKIPPED" ? <p className="text-xs text-ink-muted">Skipped</p> : <AnswerReveal v={v} r={r} />}
        </li>
      ))}
    </ol>
  );
}
