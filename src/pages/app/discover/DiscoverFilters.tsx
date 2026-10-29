import { useEffect, useState } from "react";
import { Button } from "../../../components/ui/Button";
import { Chip } from "../../../components/ui/Chip";
import { Input, Select } from "../../../components/ui/Field";
import { INTENTIONS } from "../../../lib/labels";
import type { Intention, OwnProfile } from "../../../lib/types";

export interface Filters {
  intentions: Intention[];
  ageMin?: number;
  ageMax?: number;
  maxDistanceKm?: number;
  interests: string[];
}

export const EMPTY_FILTERS: Filters = { intentions: [], interests: [] };

export function filtersFromParams(p: URLSearchParams): Filters {
  const num = (k: string) => (p.get(k) ? Number(p.get(k)) : undefined);
  return {
    intentions: (p.get("intentions")?.split(",").filter(Boolean) ?? []) as Intention[],
    interests: p.get("interests")?.split(",").filter(Boolean) ?? [],
    ageMin: num("ageMin"),
    ageMax: num("ageMax"),
    maxDistanceKm: num("maxDistanceKm"),
  };
}

export function filtersToQuery(f: Filters) {
  const q = new URLSearchParams();
  if (f.intentions.length) q.set("intentions", f.intentions.join(","));
  if (f.interests.length) q.set("interests", f.interests.join(","));
  if (f.ageMin) q.set("ageMin", String(f.ageMin));
  if (f.ageMax) q.set("ageMax", String(f.ageMax));
  if (f.maxDistanceKm) q.set("maxDistanceKm", String(f.maxDistanceKm));
  return q;
}

export const activeFilterCount = (f: Filters) => [f.intentions.length > 0, f.interests.length > 0, !!(f.ageMin || f.ageMax), !!f.maxDistanceKm].filter(Boolean).length;

/**
 * Filters narrow the member's saved preferences for this search only. Options are limited to
 * what those preferences allow, so the UI never offers a filter that can't return anyone.
 */
export function DiscoverFilters({ me, value, onApply, interestNames }: { me: OwnProfile; value: Filters; onApply: (f: Filters) => void; interestNames: Map<string, string> }) {
  const [draft, setDraft] = useState<Filters>(value);
  useEffect(() => setDraft(value), [value]);
  const allowedIntentions = me.soughtIntentions.length ? me.soughtIntentions : me.intentions;
  const distances = [5, 10, 25, 50, 100].filter((d) => !me.maxDistanceKm || d < me.maxDistanceKm);
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const ageError = draft.ageMin && draft.ageMax && draft.ageMax < draft.ageMin ? "Must be at least the minimum." : undefined;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ageError) onApply(draft);
      }}
      className="space-y-6"
    >
      <fieldset>
        <legend className="text-sm font-semibold">Relationship intention</legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {INTENTIONS.filter((i) => allowedIntentions.includes(i.value)).map((i) => (
            <Chip key={i.value} selected={draft.intentions.includes(i.value)} onToggle={() => setDraft((d) => ({ ...d, intentions: toggle(d.intentions, i.value) }))}>
              {i.title}
            </Chip>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm font-semibold">Age</legend>
        <p className="text-xs text-ink-muted">
          Within your saved range of {me.ageMin}–{me.ageMax}.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Input label="From" type="number" inputMode="numeric" min={me.ageMin} max={me.ageMax} placeholder={String(me.ageMin)} value={draft.ageMin ?? ""} onChange={(e) => setDraft((d) => ({ ...d, ageMin: e.target.value ? Number(e.target.value) : undefined }))} />
          <Input label="To" type="number" inputMode="numeric" min={me.ageMin} max={me.ageMax} placeholder={String(me.ageMax)} error={ageError} value={draft.ageMax ?? ""} onChange={(e) => setDraft((d) => ({ ...d, ageMax: e.target.value ? Number(e.target.value) : undefined }))} />
        </div>
      </fieldset>
      <Select label="Location" hint={me.maxDistanceKm ? `Your saved limit is ${me.maxDistanceKm} km.` : "From your city or approximate area."} value={draft.maxDistanceKm ?? ""} onChange={(e) => setDraft((d) => ({ ...d, maxDistanceKm: e.target.value ? Number(e.target.value) : undefined }))}>
        <option value="">{me.maxDistanceKm ? `Within ${me.maxDistanceKm} km (saved)` : "Anywhere"}</option>
        {distances.map((d) => (
          <option key={d} value={d}>
            Within {d} km
          </option>
        ))}
      </Select>
      {me.interests.length > 0 && (
        <fieldset>
          <legend className="text-sm font-semibold">Shares at least one of your interests</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {me.interests.map((slug) => (
              <Chip key={slug} selected={draft.interests.includes(slug)} onToggle={() => setDraft((d) => ({ ...d, interests: toggle(d.interests, slug) }))}>
                {interestNames.get(slug) ?? slug}
              </Chip>
            ))}
          </div>
        </fieldset>
      )}
      <div className="flex gap-2 border-t hairline pt-5">
        <Button type="submit" className="flex-1">
          Show results
        </Button>
        <Button variant="quiet" onClick={() => onApply(EMPTY_FILTERS)}>
          Clear
        </Button>
      </div>
    </form>
  );
}
