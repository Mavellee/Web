import { DIMENSION_LABEL, intentionLabel } from "../../lib/labels";
import { cx } from "../../lib/format";
import type { Intention } from "../../lib/types";

type Shared = {
  profile?: { displayName: string; age: number | null; city: string | null; bio: string | null; interests: string[] };
  intentions?: { own: Intention[]; sought: Intention[] };
  compatibilityAnswers?: { question: string; answer: string; openTo: string[]; importance: number; dealbreaker: boolean }[];
  matchCompatibility?: { score: number | null; confidence: string; dimensions: { dimension: string; score: number | null }[]; items: { label: string; status: string }[] } | null;
};

const IMPORTANCE = ["Doesn't matter", "A little", "Quite", "Very"];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border hairline bg-white p-4">
      <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{title}</h4>
      <div className="mt-2 text-sm">{children}</div>
    </section>
  );
}

/** Renders exactly what the member consented to share, captured when they made the request. */
export function SharedDataView({ data, fields }: { data: Shared; fields: string[] }) {
  if (!fields.length) return <p className="text-sm text-ink-muted">The member shared only their question.</p>;
  return (
    <div className="space-y-3">
      {data.profile && (
        <Block title="Profile summary">
          <p className="font-semibold">
            {data.profile.displayName}
            {data.profile.age != null && `, ${data.profile.age}`}
            {data.profile.city && <span className="font-normal text-ink-muted"> · {data.profile.city}</span>}
          </p>
          {data.profile.bio && <p className="mt-1 text-ink-soft">{data.profile.bio}</p>}
          {!!data.profile.interests.length && <p className="mt-2 text-ink-muted">Interests: {data.profile.interests.join(", ")}</p>}
        </Block>
      )}
      {data.intentions && (
        <Block title="Relationship intentions">
          <p>Open to: {data.intentions.own.map(intentionLabel).join(", ") || "—"}</p>
          {!!data.intentions.sought.length && <p className="text-ink-muted">Looking for: {data.intentions.sought.map(intentionLabel).join(", ")}</p>}
        </Block>
      )}
      {data.compatibilityAnswers && (
        <Block title={`Compatibility answers (${data.compatibilityAnswers.length})`}>
          {data.compatibilityAnswers.length ? (
            <ul className="divide-y hairline">
              {data.compatibilityAnswers.map((a) => (
                <li key={a.question} className="py-2">
                  <p className="text-ink-soft">{a.question}</p>
                  <p className="font-semibold">
                    {a.answer}
                    {a.dealbreaker && <span className="ml-2 rounded-full bg-rose-soft px-2 py-0.5 text-xs text-rose-ink">Dealbreaker</span>}
                  </p>
                  <p className="text-xs text-ink-muted">
                    Matters: {IMPORTANCE[a.importance] ?? a.importance}
                    {a.openTo.length ? ` · open to: ${a.openTo.join(", ")}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-ink-muted">No answers yet.</p>
          )}
        </Block>
      )}
      {"matchCompatibility" in data && (
        <Block title="Compatibility summary with a match">
          {data.matchCompatibility && data.matchCompatibility.score !== null ? (
            <>
              <p>
                <span className="font-serif text-2xl text-plum">{data.matchCompatibility.score}</span> / 100 overlap · {data.matchCompatibility.confidence.replace(/_/g, " ")}
              </p>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {data.matchCompatibility.dimensions.map((d) => (
                  <li key={d.dimension} className="flex justify-between text-ink-soft">
                    <span>{DIMENSION_LABEL[d.dimension]}</span>
                    <span>{d.score === null ? "No data" : `${d.score}%`}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-muted">The match's own answers and the conversation are never shared.</p>
            </>
          ) : (
            <p className="text-ink-muted">Not enough shared answers to calculate.</p>
          )}
        </Block>
      )}
    </div>
  );
}

export const REQUEST_STATUS: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "Waiting for an expert", cls: "bg-gold-soft text-gold-ink" },
  IN_REVIEW: { label: "In review", cls: "bg-lavender-soft text-plum-700" },
  INFO_REQUESTED: { label: "Waiting on member", cls: "bg-rose-soft text-rose-ink" },
  COMPLETED: { label: "Completed", cls: "bg-sage text-sage-ink" },
  DECLINED: { label: "Declined", cls: "bg-ink/5 text-ink-soft" },
  CANCELLED: { label: "Cancelled by member", cls: "bg-ink/5 text-ink-soft" },
};

export function StatusPill({ status }: { status: string }) {
  const s = REQUEST_STATUS[status] ?? { label: status, cls: "bg-ink/5" };
  return <span className={cx("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", s.cls)}>{s.label}</span>;
}
