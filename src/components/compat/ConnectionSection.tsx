import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { AiPanel } from "../app/AiPanel";
import { CompatibilityBreakdown } from "./CompatibilityBreakdown";
import { CONFIDENCE_LABEL } from "../../lib/labels";
import type { CompatResult } from "../../lib/types";

const NOT_ENOUGH = "There aren't enough answers you've both given to compare yet.";

// Questions read as a checklist of topics here. Only that answers line up is ever shown, never the answers.
const TOPIC: Record<string, string> = {
  children: "Children",
  pace: "Pace of dating",
  conflict: "Handling arguments",
  texting: "Staying in touch",
  feelings: "Sharing feelings",
  weekends: "Weekends",
  smoking: "Smoking",
  drinking: "Drinking",
  mornings: "Morning or night",
  family: "Family",
  money: "Money",
  space: "Personal space",
  ambition: "Career",
};

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
  const values = items.filter((i) => i.status === "aligned" && i.dimension !== "RELATIONSHIP_GOALS" && i.key !== "interests").slice(0, 6);
  const different = items.filter((i) => (i.status === "different" || i.status === "partly_aligned") && i.key !== "interests").slice(0, 3);
  // A plain-words reading of the real score; never shown without one.
  const headline = !scored ? "Still discovering your compatibility" : score >= 80 ? "You're very aligned" : score >= 60 ? "You're well aligned" : score >= 40 ? "Some real common ground" : "Quite different so far";

  return (
    <section id={id} aria-labelledby={`${id ?? "connection"}-title`} className="scroll-mt-24">
      <div className="rounded-[1.75rem] bg-panel px-6 py-9 text-paper sm:px-10 sm:py-12">
        <div className="text-center">
          <h3 id={`${id ?? "connection"}-title`} className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-paper/80">
            Compatibility
          </h3>
          <ScoreRing score={scored ? score : null} />
          <h4 className="font-serif text-3xl leading-tight text-paper sm:text-4xl">{headline}</h4>
          <p className="mx-auto mt-2 max-w-md text-paper/80">
            {scored ? `${score}% overlap with ${name}. ${CONFIDENCE_LABEL[result!.confidence]} you both chose to give.` : NOT_ENOUGH}
          </p>
          {!scored && !preview && (
            <p className="mt-3 text-sm">
              <Link to="/app/compatibility" className="font-semibold text-paper underline underline-offset-4">
                Answer a few compatibility questions
              </Link>{" "}
              <span className="text-paper/80">to see more next time.</span>
            </p>
          )}
        </div>

        {sharedInterests.length > 0 && (
          <Group title="You both love">
            <ul className="flex flex-wrap gap-2" aria-label="You both listed">
              {sharedInterests.map((s) => (
                <li key={s} className="rounded-full border border-paper/30 px-3.5 py-1 text-sm text-paper">
                  {s}
                </li>
              ))}
            </ul>
          </Group>
        )}
        {goals.length > 0 && <Group title="You agree on your future" items={goals} />}
        {values.length > 0 && <Group title="You agree on everyday life" items={values} />}
        {different.length > 0 && <Group title="Worth a conversation" note="Different answers aren't wrong ones." items={different} quiet />}

        <p className="mt-8 border-t border-paper/15 pt-5 text-xs text-paper/80">It reflects stated preferences only — it can't predict how things will go.</p>
        {result && (
          <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-paper underline-offset-4 hover:underline">
            {open ? "Hide compatibility details" : "See compatibility details"}
            <Icon name={open ? "chevronLeft" : "chevronRight"} className="h-4 w-4 rotate-90" />
          </button>
        )}
      </div>
      {result && open && (
        <div className="mt-5 space-y-5">
          <CompatibilityBreakdown result={result} otherName={name} />
          {!preview && result.score !== null && <AiPanel title="Explain this in plain words" request={{ feature: "explain_compatibility", userId }} />}
        </div>
      )}
    </section>
  );
}

function Group({ title, note, items, quiet, children }: { title: string; note?: string; items?: CompatResult["items"]; quiet?: boolean; children?: ReactNode }) {
  return (
    <div className="mt-8 border-t border-paper/15 pt-6">
      <h4 className="font-serif text-xl text-paper">{title}</h4>
      {note && <p className="mt-1 text-sm text-paper/80">{note}</p>}
      <div className="mt-3">
        {children}
        {items && (
          <ul className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
            {items.map((i) => (
              <li key={i.key} className="flex items-baseline gap-2.5 text-paper/90">
                <span aria-hidden="true" className={quiet ? "text-[0.5rem] text-paper/60" : "text-[0.5rem] text-gold"}>
                  &#9670;
                </span>
                {TOPIC[i.key] ?? i.label.replace(/^Both open to: /, "")}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/** The overlap score as a ring; an empty ring when there isn't a score yet. */
function ScoreRing({ score }: { score: number | null }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative mx-auto my-6 h-36 w-36" role="img" aria-label={score === null ? "No score yet" : `${score}% overlap`}>
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="40" cy="40" r={r} fill="none" strokeWidth="4" className="stroke-paper/20" />
        {score !== null && <circle cx="40" cy="40" r={r} fill="none" strokeWidth="4" strokeLinecap="round" className="stroke-gold transition-[stroke-dashoffset] duration-700" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />}
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-serif text-4xl text-paper">{score === null ? "—" : `${score}%`}</span>
    </div>
  );
}
