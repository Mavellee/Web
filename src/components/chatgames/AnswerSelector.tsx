import { useId, useState } from "react";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { cx } from "../../lib/format";
import type { GameView, RoundView } from "./types";
import { partnerOf } from "./GamePieces";

// Small visual cues for the Red Flag or Green Flag options. Labels carry the meaning; colour only supports it.
const FLAG_TONE: Record<string, string> = {
  "Red Flag": "text-error",
  "Green Flag": "text-success",
  "It Depends": "text-gold-ink",
};

/** Collects the viewer's private answer. The server withholds it from the partner until both have answered. */
export function AnswerSelector({ v, r, prompt, onSubmit, onSkipCard }: { v: GameView; r: RoundView; prompt: string; onSubmit: (a: { choice?: string; text?: string }) => Promise<boolean>; onSkipCard: () => Promise<boolean> }) {
  const [choice, setChoice] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<"submit" | "skip" | null>(null);
  const id = useId();
  const partner = partnerOf(v);
  const isChoice = !!r.options;
  const ready = isChoice ? !!choice : text.trim().length > 0;
  const run = async (key: "submit" | "skip", fn: () => Promise<boolean>) => {
    setBusy(key);
    await fn();
    setBusy(null);
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        if (ready) void run("submit", () => onSubmit(isChoice ? { choice } : { text: text.trim() }));
      }}
    >
      {isChoice ? (
        <div role="radiogroup" aria-label={prompt} className={cx("grid gap-2", r.options!.length === 3 ? "grid-cols-3" : "grid-cols-2")}>
          {r.options!.map((o) => {
            const selected = choice === o;
            const tone = FLAG_TONE[o];
            return (
              <button
                key={o}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setChoice(o)}
                className={cx(
                  "flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-2.5 text-center text-sm font-semibold transition",
                  selected ? "border-primary bg-primary text-surface shadow-soft" : "border-line bg-surface text-ink hover:border-primary/40",
                )}
              >
                {tone && <Icon name="flag" className={cx("h-4 w-4", selected ? "text-surface" : tone)} />}
                {o}
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <label htmlFor={id} className="sr-only">
            {prompt}
          </label>
          <textarea
            id={id}
            value={text}
            maxLength={500}
            rows={2}
            onChange={(e) => setText(e.target.value)}
            placeholder={v.rules.mode === "guess" && r.subjectUserId !== v.participants.find((p) => p.isYou)?.userId ? "Your best guess…" : "Your answer…"}
            className="block w-full resize-y rounded-2xl border border-line bg-surface px-3.5 py-2.5 text-[0.95rem] focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
          <p className="mt-1 text-right text-[0.7rem] text-ink-muted">{text.length}/500</p>
        </div>
      )}
      <p className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Icon name="lock" className="h-3.5 w-3.5" /> Hidden from {partner?.displayName ?? "your match"} until you've both answered.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={!ready || !!busy} loading={busy === "submit"}>
          Lock in answer
        </Button>
        <Button size="sm" variant="quiet" disabled={!!busy} loading={busy === "skip"} onClick={() => run("skip", onSkipCard)}>
          Skip this card
        </Button>
      </div>
      <p className="text-[0.7rem] text-ink-muted">Skipping moves you both on. Answers to a skipped card are never shown.</p>
    </form>
  );
}
