import type { ReactNode } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { cx } from "../../lib/format";
import { agreementLabel, answerText, partnerOf } from "./GamePieces";
import type { GameView, RoundAnswer, RoundView } from "./types";

/** Both answers side by side, whether they match, a neutral prompt to talk about, and the way on. */
export function AnswerRevealPanel({ v, r, children, onContinue }: { v: GameView; r: RoundView; children?: ReactNode; onContinue?: () => Promise<boolean> }) {
  const partner = partnerOf(v);
  const cells: [string, RoundAnswer | null][] = [
    ["You", r.you.answer],
    [partner?.displayName ?? "Partner", r.partner.answer],
  ];
  const last = v.currentRound + 1 >= v.totalRounds;
  return (
    <div className="space-y-3" aria-live="polite">
      <div className="grid grid-cols-2 gap-2">
        {cells.map(([who, a], i) => (
          <div key={who} className="animate-rise rounded-2xl border hairline bg-surface p-3" style={{ animationDelay: `${i * 90}ms` }}>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-ink-muted">{who}</p>
            <p className="mt-1 break-words text-[0.95rem] font-semibold">{answerText(a)}</p>
            {a?.note && <p className="mt-1.5 border-l-2 border-rose pl-2 text-xs text-ink-soft">{a.note}</p>}
          </div>
        ))}
      </div>
      {r.agreed !== null && (
        <p className={cx("flex items-center justify-center gap-1.5 text-center text-xs font-semibold", r.agreed ? "text-primary" : "text-accent")}>
          <Icon name={r.agreed ? "check" : "spark"} className="h-3.5 w-3.5" /> {agreementLabel(v, r.agreed)}
        </p>
      )}
      {r.discussion && (
        <div className="rounded-2xl bg-rose-soft/70 px-3.5 py-3">
          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-primary-700">Talk about it</p>
          <p className="mt-1 font-serif text-[1.05rem] leading-snug text-ink">{r.discussion}</p>
        </div>
      )}
      {children}
      {onContinue && (
        <Button size="sm" className="w-full" onClick={() => void onContinue()} icon={<Icon name="arrow" className="h-4 w-4" />}>
          {last ? "See your summary" : "Next scenario"}
        </Button>
      )}
    </div>
  );
}
