import { useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { useAutosave, type SaveStatus } from "../../lib/useAutosave";
import { useResource } from "../../lib/useResource";
import { cx } from "../../lib/format";
import type { OwnProfile, PromptAnswer, PromptDef } from "../../lib/types";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { LoadingBlock } from "../ui/Skeleton";

const MAX = 6;
const LIMIT = 250;
const FIRST_CARDS = 6;

/**
 * Choose prompts and answer them one at a time, seeing how each will read on your profile.
 * With `autosave`, an answer also saves itself shortly after you stop typing.
 */
export function PromptWriter({ answers, onSaved, autosave = false, onStatus }: { answers: PromptAnswer[]; onSaved: (p: OwnProfile) => void; autosave?: boolean; onStatus?: (s: SaveStatus, retry?: () => void) => void }) {
  const catalogue = useResource<PromptDef[]>("/meta/prompts");
  const [list, setList] = useState<PromptAnswer[]>(answers);
  const [activeKey, setActiveKey] = useState<string | null>(answers[0]?.key ?? null);
  const [draft, setDraft] = useState(answers[0]?.answer ?? "");
  const [showAll, setShowAll] = useState(false);
  const writer = useRef<HTMLElement>(null);
  const [showIdeas, setShowIdeas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setList(answers), [answers]);
  const active = useMemo(() => catalogue.data?.find((p) => p.key === activeKey) ?? null, [catalogue.data, activeKey]);
  const listRef = useRef(list);
  listRef.current = list;

  const persist = async (next: PromptAnswer[]) => {
    setSaving(true);
    setError(null);
    try {
      const saved = await api.put<OwnProfile>("/profiles/me/prompts", { prompts: next.map(({ key, answer }) => ({ key, answer })) });
      setList(saved.prompts);
      onSaved(saved);
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? (Object.values(e.details ?? {}).flat()[0] as string | undefined) ?? e.message : "Couldn't save. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const withAnswer = (key: string, text: string, answer: string) => {
    const cur = listRef.current;
    return cur.some((x) => x.key === key) ? cur.map((x) => (x.key === key ? { ...x, answer } : x)) : [...cur, { key, text, answer }];
  };

  const { flush } = useAutosave(
    { key: activeKey, answer: draft.trim() },
    async ({ key, answer }) => {
      const cur = listRef.current;
      const def = catalogue.data?.find((p) => p.key === key);
      if (!key || !def || !answer || cur.find((x) => x.key === key)?.answer === answer) return;
      if (cur.length >= MAX && !cur.some((x) => x.key === key)) return;
      if (!(await persist(withAnswer(key, def.text, answer)))) throw new Error("not saved");
    },
    { enabled: autosave && !!catalogue.data, delay: 1200, onStatus },
  );

  const select = (key: string, list_ = list) => {
    if (key !== activeKey) void flush();
    setActiveKey(key);
    setDraft(list_.find((x) => x.key === key)?.answer ?? "");
    setShowIdeas(false);
    if (key !== activeKey) writer.current?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  };

  const saveAnswer = async () => {
    if (!active || !draft.trim()) return;
    const next = withAnswer(active.key, active.text, draft.trim());
    if (await persist(next)) {
      const nextOpen = catalogue.data?.find((p) => !next.some((x) => x.key === p.key));
      if (next.length < 3 && nextOpen) select(nextOpen.key, next);
    }
  };

  const remove = (key: string) => {
    if (key === activeKey) setDraft("");
    void persist(list.filter((x) => x.key !== key));
  };
  const move = (i: number, d: number) => {
    const next = [...list];
    const [m] = next.splice(i, 1);
    next.splice(i + d, 0, m);
    void persist(next);
  };

  if (catalogue.loading) return <LoadingBlock label="Loading prompts" />;
  const answeredKeys = new Set(list.map((x) => x.key));
  const full = list.length >= MAX && !answeredKeys.has(activeKey ?? "");

  const all = catalogue.data ?? [];
  const cards = showAll ? all : all.filter((p, i) => i < FIRST_CARDS || answeredKeys.has(p.key) || p.key === activeKey);

  return (
    <div className="space-y-8">
        {active ? (
          <section ref={writer} aria-label="Write your answer" className="rounded-[2rem] border hairline bg-surface p-6 sm:p-8">
            <label htmlFor="prompt-answer" className="font-serif text-2xl leading-snug">
              {active.text}
            </label>
            <textarea
              id="prompt-answer"
              value={draft}
              maxLength={LIMIT}
              rows={4}
              disabled={full}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={full ? `You've answered ${MAX} prompts — remove one to add another.` : "In your own words…"}
              className="mt-4 block w-full resize-none border-0 border-b border-line bg-transparent px-0 py-2 font-serif text-xl leading-relaxed placeholder:font-sans placeholder:text-base placeholder:text-ink-muted/70 focus:border-primary focus:outline-none focus:ring-0"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
              <button type="button" onClick={() => setShowIdeas((s) => !s)} aria-expanded={showIdeas} className="font-semibold text-primary">
                {showIdeas ? "Hide ideas" : "Need an idea?"}
              </button>
              <span>
                {draft.length}/{LIMIT}
              </span>
            </div>
            {showIdeas && (
              <ul className="mt-3 flex flex-wrap gap-2" aria-label="Ideas — use them as a starting point">
                {active.ideas.map((idea) => (
                  <li key={idea}>
                    <button type="button" onClick={() => setDraft(idea)} className="rounded-full bg-parchment-deep px-3 py-1 text-sm text-ink-soft hover:bg-rose-mist">
                      {idea}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {error && (
              <p role="alert" className="mt-3 text-sm text-error">
                {error}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              {!autosave && (
                <Button onClick={saveAnswer} disabled={!draft.trim() || full} loading={saving}>
                  {answeredKeys.has(active.key) ? "Update answer" : "Save answer"}
                </Button>
              )}
              {answeredKeys.has(active.key) && (
                <Button variant="quiet" onClick={() => remove(active.key)} disabled={saving}>
                  Remove
                </Button>
              )}
            </div>
          </section>
        ) : (
          <p className="rounded-[2rem] border border-dashed border-line-strong px-6 py-8 text-center font-serif text-xl text-ink-soft">Pick a prompt below to begin.</p>
        )}

        {list.length > 0 && (
          <section aria-label="How your answers will appear">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">On your profile</p>
            <ol className="mt-3 space-y-3">
              {list.map((x, i) => (
                <li key={x.key} className="flex gap-3 rounded-3xl bg-rose-mist/50 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-muted">{x.text}</p>
                    <p className="mt-1 font-serif text-lg leading-snug">{x.answer}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <IconButton icon="chevronLeft" className="rotate-90" size="sm" label={`Move "${x.text}" up`} disabled={i === 0 || saving} onClick={() => move(i, -1)} />
                    <IconButton icon="chevronRight" className="rotate-90" size="sm" label={`Move "${x.text}" down`} disabled={i === list.length - 1 || saving} onClick={() => move(i, 1)} />
                    <IconButton icon="edit" size="sm" label={`Edit "${x.text}"`} onClick={() => select(x.key)} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
        <nav aria-label="Prompts">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">
            Choose prompts · {list.length}/{MAX}
          </p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {cards.map((p) => {
              const answered = answeredKeys.has(p.key);
              const on = p.key === activeKey;
              return (
                <li key={p.key}>
                  <button type="button" onClick={() => select(p.key)} aria-current={on} className={cx("flex h-full min-h-20 w-full items-start gap-3 rounded-3xl border px-4 py-3.5 text-left font-serif text-lg leading-snug transition duration-150 active:scale-[0.99]", on ? "border-primary bg-primary text-surface shadow-soft" : "border-line bg-surface/80 text-ink hover:border-primary/40")}>
                    <span className="min-w-0 flex-1">
                      {p.text}
                      {answered && <span className="sr-only"> (answered)</span>}
                    </span>
                    {answered && <Icon name="check" className={cx("mt-1 h-4 w-4 shrink-0", on ? "text-surface" : "text-primary")} />}
                  </button>
                </li>
              );
            })}
          </ul>
          {!showAll && (catalogue.data?.length ?? 0) > cards.length && (
            <button type="button" onClick={() => setShowAll(true)} className="mt-3 text-sm font-semibold text-primary">
              Show more prompts
            </button>
          )}
        </nav>
        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Icon name="check" className="h-3.5 w-3.5" /> Nothing here is required. Two or three good answers say more than six rushed ones.
        </p>
    </div>
  );
}
