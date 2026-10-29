import { useState } from "react";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { QuestionCard, type Question } from "../../components/compat/QuestionCard";
import { Icon } from "../../components/ui/Icon";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { Tabs } from "../../components/ui/Tabs";
import { useResource } from "../../lib/useResource";
import { DIMENSION_LABEL } from "../../lib/labels";

type Method = { version: string; weights: Record<string, number>; notes: string[] };

export function Compatibility() {
  const questions = useResource<Question[]>("/compatibility/questions");
  const method = useResource<Method>("/compatibility/method");
  const [filter, setFilter] = useState("ALL");
  const list = questions.data ?? [];
  const answered = list.filter((q) => q.myAnswer).length;
  const dims = [...new Set(list.map((q) => q.dimension))];
  const shown = list.filter((q) => filter === "ALL" || q.dimension === filter);

  return (
    <AppPage wide>
      <PageHeader title="Compatibility" lede="Optional questions that help explain what you and others have in common. Answer only what matters to you — skipping is never held against you." />
      {questions.loading ? (
        <LoadingBlock label="Loading questions" />
      ) : questions.error ? (
        <ErrorState message={questions.error.message} onRetry={questions.reload} />
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] [&>*]:min-w-0">
          <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
            <section aria-labelledby="progress-title" className="rounded-3xl border hairline bg-white p-6">
              <h2 id="progress-title" className="font-sans text-sm font-semibold">
                Your answers
              </h2>
              <p className="mt-2 font-serif text-4xl text-plum">
                {answered}
                <span className="text-xl text-ink-muted"> / {list.length}</span>
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {dims.map((d) => {
                  const total = list.filter((q) => q.dimension === d).length;
                  const done = list.filter((q) => q.dimension === d && q.myAnswer).length;
                  return (
                    <li key={d}>
                      <div className="flex justify-between">
                        <span className="text-ink-soft">{DIMENSION_LABEL[d]}</span>
                        <span className="text-ink-muted">
                          {done}/{total}
                        </span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-ivory-deep">
                        <div className="h-full rounded-full bg-plum transition-all duration-500" style={{ width: `${(done / total) * 100}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
              {answered < 3 && (
                <p className="mt-5 rounded-2xl bg-gold-soft/70 p-3 text-sm text-gold-ink">
                  Scores appear on profiles once you and another person have both answered some of the same questions. Until then we show “not enough to compare” — we never guess.
                </p>
              )}
            </section>
            {method.data && (
              <details className="rounded-3xl border hairline bg-white/70 p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between font-semibold text-ink">
                  How scores work <Icon name="chevronRight" className="h-4 w-4" />
                </summary>
                <ul className="mt-3 space-y-2 text-sm text-ink-soft">
                  {method.data.notes.map((n) => (
                    <li key={n} className="flex gap-2">
                      <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-sage-ink" />
                      {n}
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-ink-muted">
                  Weights:{" "}
                  {Object.entries(method.data.weights)
                    .map(([k, v]) => `${DIMENSION_LABEL[k]} ${v}`)
                    .join(" · ")}
                  . Engine {method.data.version}.
                </p>
              </details>
            )}
          </aside>
          <section aria-label="Questions">
            <Tabs label="Question topics" className="mb-6" value={filter} onChange={setFilter} tabs={[{ value: "ALL", label: "All" }, ...dims.map((d) => ({ value: d, label: DIMENSION_LABEL[d] }))]} />
            <div className="space-y-4">
              {shown.map((q) => (
                <QuestionCard key={q.id} q={q} onSaved={(nq) => questions.setData((l) => l!.map((x) => (x.id === nq.id ? nq : x)))} />
              ))}
            </div>
          </section>
        </div>
      )}
    </AppPage>
  );
}
