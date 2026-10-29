import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Skeleton } from "../ui/Skeleton";
import { useSocket } from "../../lib/socket";
import type { Message } from "../../lib/types";
import { cx } from "../../lib/format";
import { AnswerRevealPanel } from "./AnswerRevealPanel";
import { GameReconnectBanner, GameRoundHeader, partnerOf, promptFor } from "./GamePieces";
import { GameProgress } from "./GameProgress";
import { GameResultsSummary } from "./GameResultsSummary";
import { GameRoundPanel } from "./GameRoundPanel";
import { isLive, type GameView } from "./types";
import type { ConversationGames } from "./useConversationGames";

/** A game event in the conversation timeline: the live game card, or a finished-game summary. */
export function InlineGameCard({ message, games }: { message: Message; games: ConversationGames }) {
  const v = message.gameSessionId ? games.sessions[message.gameSessionId] : undefined;
  const event = (message.metadata?.event as string) ?? "started";

  if (event !== "started") {
    return (
      <div className="py-2">
        <GameResultsSummary metadata={message.metadata ?? {}} v={v} />
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
    <article id={`game-card-${v.id}`} aria-label={`${v.game.name} game`} className={cx("mx-auto my-3 w-full max-w-md rounded-[1.75rem] border bg-surface/95 p-4 shadow-soft transition", live ? "border-primary/25" : "hairline")}>
      <GameRoundHeader
        v={v}
        right={
          !live && (
            <button type="button" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded} className="rounded-full px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-50">
              {expanded ? "Hide" : "View cards"}
            </button>
          )
        }
      />

      {(live || expanded) && (
        <div className="mt-4 space-y-4">
          {v.status !== "WAITING" && <GameProgress v={v} />}
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
            <div className="flex items-center justify-between gap-3 rounded-2xl bg-rose-mist/70 p-3">
              <p className="text-sm text-primary-700">The game is paused.</p>
              <Button size="sm" onClick={() => act("resume")}>
                Resume
              </Button>
            </div>
          )}

          {v.status === "ACTIVE" && v.round && <GameRoundPanel v={v} r={v.round} act={act} />}

          {!live && expanded && <History v={v} />}

          {live && v.status !== "WAITING" && (
            <footer className="flex justify-end gap-1 border-t hairline pt-3">
              {v.status === "ACTIVE" && (
                <Button size="sm" variant="quiet" onClick={() => act("pause")}>
                  Pause
                </Button>
              )}
              <Button size="sm" variant="quiet" className="text-accent" onClick={() => setConfirmEnd(true)}>
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

function History({ v }: { v: GameView }) {
  if (!v.history.length) return <p className="text-sm text-ink-muted">No cards were played.</p>;
  return (
    <ol className="space-y-3">
      {v.history.map((r) => (
        <li key={r.index} className="space-y-2 border-t hairline pt-3 first:border-0 first:pt-0">
          {r.theme && <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-accent">{r.theme}</p>}
          <p className="text-sm font-semibold">{promptFor(v, r)}</p>
          {r.status === "SKIPPED" ? <p className="text-xs text-ink-muted">Skipped — answers to this card stay private.</p> : <AnswerRevealPanel v={v} r={r} />}
        </li>
      ))}
    </ol>
  );
}
