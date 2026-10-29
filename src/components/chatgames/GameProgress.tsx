import { cx } from "../../lib/format";
import type { GameView } from "./types";

/** One segment per card: played, current, or still to come. */
export function GameProgress({ v }: { v: GameView }) {
  const finished = v.history.map((h) => h.index);
  const live = v.status === "ACTIVE" || v.status === "PAUSED";
  return (
    <div className="space-y-1.5">
      <ol className="flex gap-1" aria-label={`${finished.length} of ${v.totalRounds} cards played`}>
        {Array.from({ length: v.totalRounds }, (_, i) => {
          const done = finished.includes(i);
          const current = i === v.currentRound && live && !done;
          return <li key={i} className={cx("h-1 flex-1 rounded-full transition-colors duration-500", done ? "bg-primary" : current ? "bg-rose" : "bg-parchment-deep")} />;
        })}
      </ol>
      {live && v.round?.theme && <p className="text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-accent">{v.round.theme}</p>}
    </div>
  );
}
