import { CONFIDENCE_LABEL, DIMENSION_LABEL } from "../../lib/labels";
import { cx } from "../../lib/format";
import type { CompatResult } from "../../lib/types";

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  aligned: { label: "Aligned", cls: "bg-sage text-sage-ink" },
  partly_aligned: { label: "Partly aligned", cls: "bg-gold-soft text-gold-ink" },
  different: { label: "Different", cls: "bg-rose-soft text-rose-ink" },
  missing_you: { label: "You haven't answered", cls: "bg-ink/5 text-ink-soft" },
  missing_them: { label: "They haven't answered", cls: "bg-ink/5 text-ink-soft" },
  missing_both: { label: "Neither answered", cls: "bg-ink/5 text-ink-soft" },
};

export function CompatibilityBreakdown({ result, otherName }: { result: CompatResult; otherName: string }) {
  return (
    <section aria-labelledby="compat-title" className="rounded-4xl border hairline bg-white/80 p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Compatibility</p>
          <h2 id="compat-title" className="mt-2 text-3xl">
            {result.score === null ? "Not enough to compare yet" : `${result.score} / 100 overlap`}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{CONFIDENCE_LABEL[result.confidence]}. This reflects stated preferences only — it doesn't predict how things will go.</p>
        </div>
        {result.dealbreakerConflicts > 0 && <p className="rounded-full bg-rose-soft px-3 py-1.5 text-sm font-semibold text-rose-ink">{result.dealbreakerConflicts} dealbreaker conflict{result.dealbreakerConflicts > 1 ? "s" : ""}</p>}
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {result.dimensions.map((d) => (
          <li key={d.dimension} className="rounded-2xl bg-ivory-deep/60 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{DIMENSION_LABEL[d.dimension]}</span>
              <span className="text-ink-muted">{d.score === null ? "No data" : `${d.score}%`}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white" role="presentation">
              <div className="h-full rounded-full bg-plum transition-all duration-700" style={{ width: `${d.score ?? 0}%` }} />
            </div>
            {d.missing > 0 && <p className="mt-1.5 text-xs text-ink-muted">{d.missing} answered by only one of you</p>}
          </li>
        ))}
      </ul>
      <details className="group mt-6">
        <summary className="cursor-pointer list-none text-sm font-semibold text-plum">
          <span className="group-open:hidden">See what contributed</span>
          <span className="hidden group-open:inline">Hide details</span>
        </summary>
        <ul className="mt-4 divide-y hairline">
          {result.items.map((i) => (
            <li key={i.key} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm">{i.label}</span>
              <span className="flex gap-1.5">
                {i.dealbreaker && <span className="rounded-full bg-rose px-2.5 py-0.5 text-xs font-semibold text-rose-ink">{i.dealbreaker === "yours" ? "Your dealbreaker" : `${otherName}'s dealbreaker`}</span>}
                <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[i.status].cls)}>{STATUS_STYLE[i.status].label}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-muted">Individual answers stay private — we only show whether they line up. Engine version {result.version}.</p>
      </details>
    </section>
  );
}
