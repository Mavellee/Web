import { useId, useState } from "react";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import type { GameView, RoundView } from "./types";
import { partnerOf } from "./GamePieces";

/** Collects the viewer's private answer. Nothing is visible to the partner until both have answered. */
export function PrivateAnswerForm({ v, r, prompt, onSubmit, onPass, onSkipCard }: { v: GameView; r: RoundView; prompt: string; onSubmit: (a: { choice?: string; text?: string }) => Promise<boolean>; onPass: () => Promise<boolean>; onSkipCard: () => Promise<boolean> }) {
  const [choice, setChoice] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const id = useId();
  const partner = partnerOf(v);
  const isChoice = !!r.options;
  const ready = isChoice ? !!choice : text.trim().length > 0;
  const run = async (key: string, fn: () => Promise<boolean>) => {
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
        <div role="radiogroup" aria-label={prompt} className="flex flex-wrap gap-2">
          {r.options!.map((o) => (
            <Chip key={o} role="radio" selected={choice === o} onToggle={() => setChoice(o)}>
              {o}
            </Chip>
          ))}
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
      <p className="text-xs text-ink-muted">Hidden from {partner?.displayName ?? "your match"} until you've both answered.</p>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={!ready || !!busy} loading={busy === "submit"}>
          Lock in answer
        </Button>
        <Button size="sm" variant="quiet" disabled={!!busy} loading={busy === "pass"} onClick={() => run("pass", onPass)}>
          Pass on this one
        </Button>
        <Button size="sm" variant="quiet" disabled={!!busy} loading={busy === "skip"} onClick={() => run("skip", onSkipCard)}>
          Skip card for both
        </Button>
      </div>
    </form>
  );
}
