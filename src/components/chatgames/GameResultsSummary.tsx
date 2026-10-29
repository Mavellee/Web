import type { GameView } from "./types";

/** The final (or early-end) summary, posted into the conversation as its own timeline card. */
export function GameResultsSummary({ metadata, v }: { metadata: Record<string, unknown>; v?: GameView }) {
  const event = metadata.event as string;
  const name = (metadata.game as string) ?? v?.game.name ?? "Game";
  const by = v?.participants.find((p) => p.userId === metadata.byUserId);
  const agreements = metadata.agreements as number | null;
  const comparable = metadata.comparableRounds as number | null;
  const correct = metadata.correct as Record<string, number> | null;
  const revealed = metadata.revealedRounds as number;
  const lines: string[] = [];
  if (agreements !== null && comparable) lines.push(`You agreed on ${agreements} of ${comparable} card${comparable === 1 ? "" : "s"}.`);
  if (correct && v) for (const p of v.participants) lines.push(`${p.isYou ? "You" : p.displayName} guessed ${correct[p.userId] ?? 0} right.`);
  if (!lines.length && revealed) lines.push(`${revealed} card${revealed === 1 ? "" : "s"} answered together.`);
  const pct = agreements !== null && comparable ? Math.round((agreements / comparable) * 100) : null;

  const title = event === "completed" ? `${name} finished` : event === "declined" ? `${by?.isYou ? "You" : (by?.displayName ?? "Your match")} passed on ${name}` : `${name} ended${by ? ` by ${by.isYou ? "you" : by.displayName}` : ""}`;
  return (
    <div className="mx-auto w-full max-w-sm rounded-3xl border hairline bg-surface/90 px-4 py-3 text-center">
      <p className="text-sm font-semibold">{title}</p>
      {lines.map((l) => (
        <p key={l} className="text-sm text-ink-soft">
          {l}
        </p>
      ))}
      {pct !== null && (
        <div className="mx-auto mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-parchment-deep" role="img" aria-label={`${pct}% agreement`}>
          <div className="h-full rounded-full bg-gradient-to-r from-accent to-primary" style={{ width: `${pct}%` }} />
        </div>
      )}
      {event === "completed" && <p className="mt-2 text-xs text-ink-muted">Different answers aren't wrong answers. Keep talking about anything that surprised you.</p>}
    </div>
  );
}
