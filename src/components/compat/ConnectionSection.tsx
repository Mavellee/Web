import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { AiPanel } from "../app/AiPanel";
import { CompatibilityBreakdown } from "./CompatibilityBreakdown";
import { CONFIDENCE_LABEL } from "../../lib/labels";
import type { CompatResult } from "../../lib/types";

/**
 * "Your connection": what two people verifiably have in common, then — only when it can be calculated from
 * answers you both gave — the deterministic overlap score, with the full breakdown one tap away.
 * Shared facts and inferred compatibility are labelled separately; nothing here is guessed.
 */
export function ConnectionSection({ id, userId, name, result, sharedInterests, preview, open: openProp, onToggle }: { id?: string; userId: string; name: string; result: CompatResult | null; sharedInterests: string[]; preview?: boolean; open?: boolean; onToggle?: (open: boolean) => void }) {
  const [openState, setOpenState] = useState(false);
  const open = openProp ?? openState;
  const setOpen = (v: boolean) => (onToggle ? onToggle(v) : setOpenState(v));
  const scored = result?.score != null;
  const score = result?.score ?? 0;
  const items = result?.items ?? [];
  const goals = items.filter((i) => i.status === "aligned" && i.dimension === "RELATIONSHIP_GOALS");
  const values = items.filter((i) => i.status === "aligned" && i.dimension !== "RELATIONSHIP_GOALS" && i.key !== "interests").slice(0, 4);
  const different = items.filter((i) => (i.status === "different" || i.status === "partly_aligned") && i.key !== "interests").slice(0, 3);
  // A plain-words reading of the real score; never shown without one.
  const headline = !scored ? "Still discovering your compatibility" : score >= 80 ? "You're very aligned" : score >= 60 ? "You're well aligned" : score >= 40 ? "Some real common ground" : "Quite different so far";

  return (
    <section id={id} aria-labelledby={`${id ?? "connection"}-title`} className="scroll-mt-24 rounded-[2rem] border hairline bg-surface/85 p-6 shadow-soft sm:p-8">
      <h3 id={`${id ?? "connection"}-title`} className="font-serif text-3xl">
        Compatibility
      </h3>
      <div className="mt-5 flex items-center gap-5">
        <ScoreRing score={scored ? score : null} />
        <div className="min-w-0">
          <h4 className="font-serif text-xl leading-snug">{headline}</h4>
          <p className="mt-1 text-sm text-ink-muted">
            {scored ? `${score}% overlap with ${name}. ${CONFIDENCE_LABEL[result!.confidence]} you both chose to give.` : "There aren't enough answers you've both given to compare yet."}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-ink-muted">It reflects stated preferences only — it can't predict how things will go.</p>

      {sharedInterests.length > 0 && (
        <div className="mt-6">
          <h4 className="font-serif text-lg text-ink-soft">Shared interests</h4>
          <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="You both listed">
            {sharedInterests.map((s) => (
              <li key={s} className="rounded-full border border-line bg-parchment px-3 py-1 text-sm text-ink-soft">
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
      {goals.length > 0 && (
        <div className="mt-6">
          <h4 className="font-serif text-lg text-ink-soft">Relationship goals</h4>
          <ul className="mt-1 space-y-1 text-sm text-ink-muted">
            {goals.map((g) => (
              <li key={g.key}>{g.label}</li>
            ))}
          </ul>
        </div>
      )}
      {values.length > 0 && (
        <div className="mt-6">
          <h4 className="font-serif text-lg text-ink-soft">Similar values</h4>
          <ul className="mt-2 space-y-2 text-sm text-ink-soft">
            {values.map((a) => (
              <li key={a.key} className="flex items-start gap-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-soft text-primary" aria-hidden="true">
                  <Icon name="check" className="h-3.5 w-3.5" />
                </span>
                {a.label}
              </li>
            ))}
          </ul>
        </div>
      )}
      {different.length > 0 && (
        <div className="mt-6">
          <h4 className="font-serif text-lg text-ink-soft">A little different</h4>
          <p className="text-xs text-ink-muted">Worth a conversation — different answers aren't wrong ones.</p>
          <ul className="mt-2 space-y-1 text-sm text-ink-muted">
            {different.map((d) => (
              <li key={d.key}>{d.label}</li>
            ))}
          </ul>
        </div>
      )}

      {!scored && !preview && (
        <p className="mt-5 text-sm">
          <Link to="/app/compatibility" className="font-semibold text-primary underline-offset-4 hover:underline">
            Answer a few compatibility questions
          </Link>{" "}
          <span className="text-ink-muted">to see more next time.</span>
        </p>
      )}

      {result && (
        <div className="mt-6 border-t hairline pt-4">
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            {open ? "Hide compatibility details" : "See compatibility details"}
            <Icon name={open ? "chevronLeft" : "chevronRight"} className="h-4 w-4 rotate-90" />
          </button>
          {open && (
            <div className="mt-5 space-y-5">
              <CompatibilityBreakdown result={result} otherName={name} />
              {!preview && result.score !== null && <AiPanel title="Explain this in plain words" request={{ feature: "explain_compatibility", userId }} />}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/** The overlap score as a ring; an empty ring when there isn't a score yet. */
function ScoreRing({ score }: { score: number | null }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24 shrink-0" role="img" aria-label={score === null ? "No score yet" : `${score}% overlap`}>
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" className="stroke-parchment-deep" />
        {score !== null && <circle cx="40" cy="40" r={r} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-primary transition-[stroke-dashoffset] duration-700" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-serif text-2xl text-primary">{score === null ? "—" : `${score}%`}</span>
    </div>
  );
}
