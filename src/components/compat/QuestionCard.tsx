import { useState } from "react";
import { api } from "../../lib/api";
import { DIMENSION_LABEL } from "../../lib/labels";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Badge } from "../ui/Badge";
import { useToast } from "../ui/Toast";

export interface Question {
  id: string;
  key: string;
  dimension: string;
  prompt: string;
  options: { value: string; label: string }[];
  myAnswer: { answer: string; acceptable: string[]; importance: number; isDealbreaker: boolean } | null;
}

const IMPORTANCE = ["Doesn't matter", "A little", "Quite", "Very"];

export function QuestionCard({ q, onSaved }: { q: Question; onSaved?: (q: Question) => void }) {
  const [answer, setAnswer] = useState(q.myAnswer?.answer ?? "");
  const [acceptable, setAcceptable] = useState<string[]>(q.myAnswer?.acceptable ?? []);
  const [importance, setImportance] = useState(q.myAnswer?.importance ?? 1);
  const [dealbreaker, setDealbreaker] = useState(q.myAnswer?.isDealbreaker ?? false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const dirty =
    answer !== (q.myAnswer?.answer ?? "") ||
    importance !== (q.myAnswer?.importance ?? 1) ||
    dealbreaker !== (q.myAnswer?.isDealbreaker ?? false) ||
    acceptable.join() !== (q.myAnswer?.acceptable ?? []).join();

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await api.put<Question["myAnswer"]>(`/compatibility/answers/${q.id}`, { answer, acceptable, importance, isDealbreaker: dealbreaker });
      onSaved?.({ ...q, myAnswer: saved });
      toast("Answer saved");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  };

  const skip = async () => {
    await api.delete(`/compatibility/answers/${q.id}`);
    setAnswer("");
    setAcceptable([]);
    setImportance(1);
    setDealbreaker(false);
    onSaved?.({ ...q, myAnswer: null });
  };

  const toggleAcceptable = (v: string) => setAcceptable((a) => (a.includes(v) ? a.filter((x) => x !== v) : [...a, v]));

  return (
    <fieldset className="rounded-3xl border hairline bg-surface/75 p-5 shadow-soft sm:p-6">
      <legend className="sr-only">{q.prompt}</legend>
      <div className="flex items-start justify-between gap-3">
        <p className="font-serif text-xl leading-snug" aria-hidden="true">
          {q.prompt}
        </p>
        <Badge tone="neutral" className="shrink-0">
          {DIMENSION_LABEL[q.dimension]}
        </Badge>
      </div>
      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Your answer</p>
        <div role="radiogroup" aria-label="Your answer" className="flex flex-wrap gap-2">
          {q.options.map((o) => (
            <Chip key={o.value} role="radio" selected={answer === o.value} onToggle={() => setAnswer(o.value)}>
              {o.label}
            </Chip>
          ))}
        </div>
      </div>
      {answer && (
        <div className="mt-5 space-y-4 animate-rise">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">Answers you'd be happy with from a partner</p>
            <div className="flex flex-wrap gap-2">
              {q.options.map((o) => (
                <Chip key={o.value} selected={acceptable.includes(o.value)} onToggle={() => toggleAcceptable(o.value)}>
                  {o.label}
                </Chip>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-muted">Leave all unselected if any answer is fine.</p>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">How much does this matter to you?</p>
            <div role="radiogroup" aria-label="Importance" className="flex flex-wrap gap-2">
              {IMPORTANCE.map((label, i) => (
                <Chip key={label} role="radio" selected={importance === i} onToggle={() => setImportance(i)}>
                  {label}
                </Chip>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-3 text-sm text-ink-soft">
            <input type="checkbox" className="h-5 w-5 accent-primary" checked={dealbreaker} onChange={(e) => setDealbreaker(e.target.checked)} disabled={!acceptable.length} />
            This is a dealbreaker for me {!acceptable.length && <span className="text-ink-muted">(choose acceptable answers first)</span>}
          </label>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button size="sm" onClick={save} disabled={!answer || !dirty} loading={saving}>
          {q.myAnswer ? "Update" : "Save answer"}
        </Button>
        {q.myAnswer && (
          <Button size="sm" variant="quiet" onClick={skip}>
            Remove answer
          </Button>
        )}
      </div>
    </fieldset>
  );
}
