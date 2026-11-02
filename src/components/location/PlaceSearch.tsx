import { useEffect, useId, useState } from "react";
import { api } from "../../lib/api";
import { placeLabel, type Place } from "../../lib/location";
import { cx } from "../../lib/format";
import { Icon } from "../ui/Icon";

/** Search Mavelle's own list of cities and localities. What's typed stays on our server; no map service is called. */
export function PlaceSearch({ onPick, busy, autoFocus }: { onPick: (p: Place) => void; busy?: boolean; autoFocus?: boolean }) {
  const id = useId();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [active, setActive] = useState(0);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }
    let live = true;
    const t = setTimeout(() => {
      api
        .get<Place[]>(`/location/places?q=${encodeURIComponent(term)}`)
        .then((r) => {
          if (!live) return;
          setResults(r);
          setActive(0);
          setSearched(true);
        })
        .catch(() => live && setResults([]));
    }, 200);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q]);

  const open = results.length > 0;
  return (
    <div className="relative">
      <label htmlFor={id} className="text-sm font-semibold">
        Search for your city or area
      </label>
      <div className="relative mt-1.5">
        <Icon name="location" className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-activedescendant={open ? `${id}-${active}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          autoFocus={autoFocus}
          disabled={busy}
          placeholder="e.g. Pune, Koramangala, Dwarka"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (!open) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(a + 1, results.length - 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(a - 1, 0));
            } else if (e.key === "Enter") {
              e.preventDefault();
              onPick(results[active]);
            }
          }}
          className="block w-full rounded-2xl border border-line bg-surface/80 py-3 pl-10 pr-4 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
        />
      </div>
      {open && (
        <ul id={`${id}-list`} role="listbox" aria-label="Places" className="absolute z-30 mt-2 max-h-72 w-full overflow-auto rounded-2xl border hairline bg-panel p-1.5 shadow-lift">
          {results.map((p, i) => (
            <li
              key={p.id}
              id={`${id}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => (e.preventDefault(), onPick(p))}
              className={cx("cursor-pointer rounded-xl px-3.5 py-2.5", i === active ? "bg-rose-mist text-ink" : "text-ink-soft")}
            >
              <span className="font-semibold text-ink">{p.name}</span>
              <span className="text-sm"> · {placeLabel({ region: p.region, country: p.country }) || p.country}</span>
            </li>
          ))}
        </ul>
      )}
      {searched && !open && <p className="mt-2 text-sm text-ink-muted">No match on our list yet. Try the nearest larger city.</p>}
    </div>
  );
}
