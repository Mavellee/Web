import { useMemo, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { useAutosave, type SaveStatus } from "../../lib/useAutosave";
import { useResource } from "../../lib/useResource";
import type { OwnProfile } from "../../lib/types";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Icon, type IconName } from "../ui/Icon";
import { LoadingBlock } from "../ui/Skeleton";

const MAX = 12;
const CATEGORY_ICONS: Record<string, IconName> = { Music: "music", "Food & drink": "food", "Books & films": "book", Travel: "plane", Hobbies: "palette", Weekend: "sun", Lifestyle: "leaf", "Conversation topics": "chat" };

/** Curated interests grouped by category, with search. With `autosave`, each change saves itself. */
export function InterestPicker({ selected, onSaved, submitLabel = "Save", secondary, autosave = false, onStatus }: { selected: string[]; onSaved: (p: OwnProfile) => void; submitLabel?: string; secondary?: React.ReactNode; autosave?: boolean; onStatus?: (s: SaveStatus, retry?: () => void) => void }) {
  const interests = useResource<{ slug: string; name: string; category: string }[]>("/meta/interests");
  const [picked, setPicked] = useState<string[]>(selected);
  const [q, setQ] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useAutosave(picked, async (v) => onSaved(await api.patch<OwnProfile>("/profiles/me", { interests: v })), { enabled: autosave, delay: 700, baseline: selected, onStatus });

  const groups = useMemo(() => {
    const term = q.trim().toLowerCase();
    const out: Record<string, { slug: string; name: string }[]> = {};
    for (const i of interests.data ?? []) if (!term || i.name.toLowerCase().includes(term) || i.category.toLowerCase().includes(term)) (out[i.category] ??= []).push(i);
    return Object.entries(out);
  }, [interests.data, q]);

  const toggle = (slug: string) => setPicked((p) => (p.includes(slug) ? p.filter((x) => x !== slug) : p.length >= MAX ? p : [...p, slug]));

  if (interests.loading) return <LoadingBlock label="Loading interests" />;
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
          onSaved(await api.patch<OwnProfile>("/profiles/me", { interests: picked }));
        } catch (err) {
          setError(err instanceof ApiError ? err.message : "Couldn't save.");
        } finally {
          setSaving(false);
        }
      }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="relative block sm:w-80">
          <span className="sr-only">Search interests</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search music, food, travel…" className="block w-full rounded-full border border-line bg-surface px-4 py-2.5 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10" />
        </label>
        <p className="text-sm text-ink-muted" aria-live="polite">
          {picked.length}/{MAX} chosen{picked.length >= MAX && " — remove one to add another"}
        </p>
      </div>
      {picked.length > 0 && (
        <ul aria-label="Your interests" className="flex flex-wrap gap-2 rounded-3xl bg-surface/70 p-3">
          {picked.map((slug) => (
            <li key={slug}>
              <button type="button" onClick={() => toggle(slug)} aria-label={`Remove ${interests.data?.find((i) => i.slug === slug)?.name ?? slug}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-sm font-medium text-surface">
                {interests.data?.find((i) => i.slug === slug)?.name ?? slug}
                <Icon name="close" className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {groups.length === 0 && <p className="text-ink-muted">Nothing matches “{q}”.</p>}
      <div className="grid gap-6 sm:grid-cols-2">
        {groups.map(([cat, list]) => (
          <fieldset key={cat}>
            <legend className="flex items-center gap-2 font-serif text-lg">
              <Icon name={CATEGORY_ICONS[cat] ?? "spark"} className="h-4 w-4 text-primary" />
              {cat}
              {list.some((i) => picked.includes(i.slug)) && <span className="font-sans text-xs font-semibold text-primary">{list.filter((i) => picked.includes(i.slug)).length}</span>}
            </legend>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {list.map((i) => (
                <Chip key={i.slug} selected={picked.includes(i.slug)} onToggle={() => toggle(i.slug)} disabled={!picked.includes(i.slug) && picked.length >= MAX}>
                  {i.name}
                </Chip>
              ))}
            </div>
          </fieldset>
        ))}
      </div>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      {!autosave && (
        <div className="flex flex-col-reverse gap-3 border-t hairline pt-6 sm:flex-row sm:justify-between">
          {secondary ?? <span />}
          <Button type="submit" size="lg" loading={saving}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
