import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { cx } from "../../lib/format";
import type { OwnProfile, PromptAnswer, PromptDef } from "../../lib/types";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { IconButton } from "../ui/IconButton";
import { LoadingBlock } from "../ui/Skeleton";

const MAX = 6;
const LIMIT = 250;

/** Choose prompts and answer them one at a time, seeing how each will read on your profile. */
export function PromptWriter({ answers, onSaved }: { answers: PromptAnswer[]; onSaved: (p: OwnProfile) => void }) {
  const catalogue = useResource<PromptDef[]>("/meta/prompts");
  const [list, setList] = useState<PromptAnswer[]>(answers);
  const [activeKey, setActiveKey] = useState<string | null>(answers[0]?.key ?? null);
  const [draft, setDraft] = useState("");
  const [showIdeas, setShowIdeas] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => setList(answers), [answers]);
  const active = useMemo(() => catalogue.data?.find((p) => p.key === activeKey) ?? null, [catalogue.data, activeKey]);
  useEffect(() => {
    setDraft(list.find((x) => x.key === activeKey)?.answer ?? "");
    setShowIdeas(false);
  }, [activeKey, list]);

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

  const saveAnswer = async () => {
    if (!active || !draft.trim()) return;
    const exists = list.some((x) => x.key === active.key);
    const next = exists ? list.map((x) => (x.key === active.key ? { ...x, answer: draft.trim() } : x)) : [...list, { key: active.key, text: active.text, answer: draft.trim() }];
    if (await persist(next)) {
      const nextOpen = catalogue.data?.find((p) => !next.some((x) => x.key === p.key));
      if (next.length < 3 && nextOpen) setActiveKey(nextOpen.key);
    }
  };

  const remove = (key: string) => void persist(list.filter((x) => x.key !== key));
  const move = (i: number, d: number) => {
    const next = [...list];
    const [m] = next.splice(i, 1);
    next.splice(i + d, 0, m);
    void persist(next);
  };

  if (catalogue.loading) return <LoadingBlock label="Loading prompts" />;
  const answeredKeys = new Set(list.map((x) => x.key));
  const full = list.length >= MAX && !answeredKeys.has(activeKey ?? "");

  return (
    <div className="grid gap-8 xl:grid-cols-[16rem_minmax(0,1fr)] [&>*]:min-w-0">
      <nav aria-label="Prompts">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Choose prompts · {list.length}/{MAX}</p>
        <ul className="mt-3 space-y-1">
          {catalogue.data?.map((p) => (
            <li key={p.key}>
              <button
                type="button"
                onClick={() => setActiveKey(p.key)}
                aria-current={p.key === activeKey}
                className={cx("flex w-full items-start gap-2 rounded-2xl px-3 py-2.5 text-left text-sm transition", p.key === activeKey ? "bg-ink text-ivory" : "text-ink-soft hover:bg-white")}
              >
                <span className={cx("mt-1 h-2 w-2 shrink-0 rounded-full", answeredKeys.has(p.key) ? "bg-sage-ink" : "bg-transparent ring-1 ring-current")} aria-hidden="true" />
                <span>
                  {p.text}
                  {answeredKeys.has(p.key) && <span className="sr-only"> (answered)</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-6">
        {active ? (
          <section aria-label="Write your answer" className="rounded-[2rem] border hairline bg-white p-6 sm:p-8">
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
              className="mt-4 block w-full resize-none border-0 border-b border-[#E4D8CD] bg-transparent px-0 py-2 font-serif text-xl leading-relaxed placeholder:font-sans placeholder:text-base placeholder:text-ink-muted/70 focus:border-plum focus:outline-none focus:ring-0"
            />
            <div className="mt-2 flex items-center justify-between text-xs text-ink-muted">
              <button type="button" onClick={() => setShowIdeas((s) => !s)} aria-expanded={showIdeas} className="font-semibold text-plum">
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
                    <button type="button" onClick={() => setDraft(idea)} className="rounded-full bg-ivory-deep px-3 py-1 text-sm text-ink-soft hover:bg-lavender-soft">
                      {idea}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {error && (
              <p role="alert" className="mt-3 text-sm text-rose-ink">
                {error}
              </p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <Button onClick={saveAnswer} disabled={!draft.trim() || full} loading={saving}>
                {answeredKeys.has(active.key) ? "Update answer" : "Save answer"}
              </Button>
              {answeredKeys.has(active.key) && (
                <Button variant="quiet" onClick={() => remove(active.key)} disabled={saving}>
                  Remove
                </Button>
              )}
            </div>
          </section>
        ) : (
          <p className="text-ink-soft">Pick a prompt to begin. Answer as many or as few as you like.</p>
        )}

        {list.length > 0 && (
          <section aria-label="How your answers will appear">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">On your profile</p>
            <ol className="mt-3 space-y-3">
              {list.map((x, i) => (
                <li key={x.key} className="flex gap-3 rounded-3xl bg-lavender-soft/50 p-5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-ink-muted">{x.text}</p>
                    <p className="mt-1 font-serif text-lg leading-snug">{x.answer}</p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <IconButton icon="chevronLeft" className="rotate-90" size="sm" label={`Move "${x.text}" up`} disabled={i === 0 || saving} onClick={() => move(i, -1)} />
                    <IconButton icon="chevronRight" className="rotate-90" size="sm" label={`Move "${x.text}" down`} disabled={i === list.length - 1 || saving} onClick={() => move(i, 1)} />
                    <IconButton icon="edit" size="sm" label={`Edit "${x.text}"`} onClick={() => setActiveKey(x.key)} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
        )}
        <p className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Icon name="check" className="h-3.5 w-3.5" /> Nothing here is required. Two or three good answers say more than six rushed ones.
        </p>
      </div>
    </div>
  );
}
