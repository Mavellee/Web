import { useState } from "react";
import { api, ApiError } from "../../lib/api";
import type { Suggestion } from "../../lib/types";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { cx } from "../../lib/format";

/** Shows optional Mavelle AI / curated suggestions. Always labelled, always dismissible. `reading` shows one explanation as prose, not a list of ideas. */
export function AiPanel({ request, title, onUse, className, autoLoad = false, reading = false }: { request: object; title: string; onUse?: (text: string) => void; className?: string; autoLoad?: boolean; reading?: boolean }) {
  const [data, setData] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(!autoLoad);

  const load = async () => {
    setDismissed(false);
    setLoading(true);
    setError(null);
    try {
      setData(await api.post<Suggestion>("/ai/suggest", request));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Suggestions aren't available right now.");
    } finally {
      setLoading(false);
    }
  };

  if (dismissed)
    return (
      <Button variant="secondary" size="sm" onClick={load} icon={<Icon name="spark" className="h-4 w-4" />} className={className}>
        {title}
      </Button>
    );

  if (reading)
    return (
      <section aria-label={title} className={cx("rounded-[1.75rem] bg-rose-soft/70 px-6 py-7 sm:px-8", className)}>
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary-text">
            <Icon name="spark" className="h-4 w-4" />
            {data?.source === "ai" ? data.label : "In plain words"}
          </p>
          <button type="button" onClick={() => setDismissed(true)} className="-m-1 rounded-full p-1 text-ink-muted hover:text-ink" aria-label="Dismiss suggestions">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
        {loading && <p className="mt-4 text-ink-muted">Putting it into words…</p>}
        {error && (
          <p role="alert" className="mt-4 text-sm text-error">
            {error}
          </p>
        )}
        {data && !loading && (
          <>
            {data.suggestions[0] && <p className="mt-4 font-serif text-2xl leading-snug text-ink">{data.suggestions[0]}</p>}
            {data.suggestions.slice(1).map((s) => (
              <p key={s} className="mt-3 leading-relaxed text-ink-soft">
                {s}
              </p>
            ))}
            {data.note && <p className="mt-5 border-t border-primary-text/15 pt-4 text-xs text-ink-muted">{data.note}</p>}
          </>
        )}
      </section>
    );

  return (
    <section aria-label={title} className={cx("rounded-3xl border border-rose/50 bg-rose-mist/70 p-4", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary-700">
          <Icon name="spark" className="h-4 w-4" />
          {data?.label ?? title}
        </p>
        <button type="button" onClick={() => setDismissed(true)} className="-m-1 rounded-full p-1 text-ink-muted hover:text-ink" aria-label="Dismiss suggestions">
          <Icon name="close" className="h-4 w-4" />
        </button>
      </div>
      {loading && <p className="mt-3 text-sm text-ink-muted">Thinking of a few ideas…</p>}
      {error && (
        <p role="alert" className="mt-3 text-sm text-error">
          {error}
        </p>
      )}
      {data && !loading && (
        <>
          <ul className="mt-3 space-y-2">
            {data.suggestions.map((s) => (
              <li key={s} className="flex items-start justify-between gap-3 rounded-2xl bg-surface/80 px-3.5 py-2.5 text-sm text-ink">
                <span>{s}</span>
                {onUse && (
                  <button type="button" onClick={() => onUse(s)} className="shrink-0 text-xs font-semibold text-primary hover:underline">
                    Use
                  </button>
                )}
              </li>
            ))}
          </ul>
          {data.note && <p className="mt-3 text-xs text-ink-muted">{data.note}</p>}
          <button type="button" onClick={load} className="mt-2 text-xs font-semibold text-primary hover:underline">
            Show different ideas
          </button>
        </>
      )}
    </section>
  );
}
