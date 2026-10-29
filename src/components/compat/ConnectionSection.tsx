import { useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { AiPanel } from "../app/AiPanel";
import { CompatibilityBreakdown } from "./CompatibilityBreakdown";
import { CONFIDENCE_LABEL, DIMENSION_LABEL } from "../../lib/labels";
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
  const aligned = result?.items.filter((i) => i.status === "aligned" && i.key !== "interests").slice(0, 4) ?? [];
  const scored = result?.score != null;
  const dims = result?.dimensions.filter((d) => d.score !== null && d.weight > 0) ?? [];

  return (
    <section id={id} aria-labelledby={`${id ?? "connection"}-title`} className="scroll-mt-24 rounded-[2rem] border hairline bg-surface/85 p-6 shadow-soft sm:p-8">
      <p className="eyebrow">Your connection</p>
      <h3 id={`${id ?? "connection"}-title`} className="mt-2 font-serif text-3xl">
        {scored ? `${result!.score}% overlap with ${name}` : "Still discovering your compatibility"}
      </h3>
      <p className="mt-1 text-sm text-ink-muted">
        {scored ? `${CONFIDENCE_LABEL[result!.confidence]} you both chose to give.` : "There aren't enough answers you've both given to compare yet."} It reflects stated preferences only — it can't predict how things will go.
      </p>

      {(sharedInterests.length > 0 || aligned.length > 0) && (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {sharedInterests.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">You both listed</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {sharedInterests.map((s) => (
                  <li key={s} className="rounded-full bg-rose-soft px-3 py-1 text-sm font-semibold text-primary-700">
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {aligned.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Where your answers line up</p>
              <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
                {aligned.map((a) => (
                  <li key={a.key} className="flex gap-2">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-accent" /> {a.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {scored && dims.length > 0 && (
        <ul className="mt-6 grid gap-x-6 gap-y-3 sm:grid-cols-2" aria-label="Overlap by area">
          {dims.map((d) => (
            <li key={d.dimension}>
              <div className="flex justify-between text-sm">
                <span>{DIMENSION_LABEL[d.dimension]}</span>
                <span className="text-ink-muted">{d.score}%</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-parchment-deep" role="presentation">
                <div className="h-full rounded-full bg-gradient-to-r from-accent to-primary" style={{ width: `${d.score}%` }} />
              </div>
            </li>
          ))}
        </ul>
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
