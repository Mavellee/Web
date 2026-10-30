import { useState } from "react";
import { api } from "../../lib/api";
import { cx } from "../../lib/format";
import { Icon } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";
import { useToast } from "../ui/Toast";
import type { Question } from "../compat/QuestionCard";

const GROUPS = [
  { dimension: "LIFESTYLE", title: "Your days", lede: "Weekends, mornings and how you like to live." },
  { dimension: "COMMUNICATION", title: "How you stay in touch", lede: "The small habits that shape a connection." },
  { dimension: "VALUES", title: "What matters to you", lede: "Family, money, space and ambition." },
];

/**
 * Optional lifestyle questions, one tap each. They use the existing compatibility questions, so every answer
 * also improves compatibility. Answers are private: others only ever see whether answers line up.
 */
export function LifestyleStep({ questions, loading, onChange }: { questions: Question[] | null; loading: boolean; onChange: (q: Question) => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();

  const pick = async (q: Question, value: string) => {
    setBusy(q.id);
    try {
      if (q.myAnswer?.answer === value) {
        await api.delete(`/compatibility/answers/${q.id}`);
        onChange({ ...q, myAnswer: null });
      } else {
        // Keep anything already set on the Compatibility page (importance, dealbreaker, acceptable answers).
        const body = { answer: value, acceptable: q.myAnswer?.acceptable ?? [], importance: q.myAnswer?.importance ?? 1, isDealbreaker: q.myAnswer?.isDealbreaker ?? false };
        const saved = await api.put<Question["myAnswer"]>(`/compatibility/answers/${q.id}`, body);
        onChange({ ...q, myAnswer: saved });
      }
    } catch {
      toast("That didn't save. Please try again.", "error");
    } finally {
      setBusy(null);
    }
  };

  if (loading && !questions) return <Skeleton className="h-64 rounded-3xl" />;
  return (
    <div className="space-y-10">
      <p className="flex items-start gap-2.5 rounded-2xl bg-surface/80 px-4 py-3 text-sm text-ink-soft">
        <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          <strong className="font-semibold text-ink">Private to you.</strong> These answers never appear on your profile. They're only used to show you and a match where you line up. Tap again to clear one.
        </span>
      </p>
      {GROUPS.map((g) => {
        const list = (questions ?? []).filter((q) => q.dimension === g.dimension);
        if (!list.length) return null;
        return (
          <section key={g.dimension} aria-label={g.title}>
            <h2 className="text-2xl">{g.title}</h2>
            <p className="text-sm text-ink-muted">{g.lede}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {list.map((q) => (
                <fieldset key={q.id} className={cx("rounded-3xl border bg-surface/85 p-5 transition-colors duration-300", q.myAnswer ? "border-primary/30" : "border-line")}>
                  <legend className="sr-only">{q.prompt}</legend>
                  <p aria-hidden="true" className="font-serif text-lg leading-snug">
                    {q.prompt}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {q.options.map((o) => {
                      const on = q.myAnswer?.answer === o.value;
                      return (
                        <button key={o.value} type="button" aria-pressed={on} disabled={busy === q.id} onClick={() => pick(q, o.value)} className={cx("min-h-10 rounded-full border px-4 text-left text-sm font-medium transition duration-150 active:scale-[0.98]", on ? "border-primary bg-primary text-surface shadow-soft" : "border-line bg-parchment/60 text-ink-soft hover:border-primary/40")}>
                          {o.label}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
