import { useState } from "react";
import { api, ApiError } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import type { ChoiceVital, Dealbreakers, OwnProfile, VitalKey, Vitals, VitalsMeta } from "../../lib/types";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Input, Select } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";
import { Toggle } from "../ui/Toggle";
import { cx } from "../../lib/format";

const CHOICES: ChoiceVital[] = ["education", "religion", "motherTongue", "diet", "drinking", "smoking", "children", "familyPlans"];
// Dealbreakers offered, in the order people usually think about them. Work is free text, so it can't be filtered.
const FILTERABLE: ChoiceVital[] = ["religion", "motherTongue", "diet", "drinking", "smoking", "children", "familyPlans", "education"];

/** 170 → "5′7″ (170 cm)" */
export function heightOption(cm: number) {
  const inches = Math.round(cm / 2.54);
  return `${Math.floor(inches / 12)}′${inches % 12}″ (${cm} cm)`;
}
const heights = (m: VitalsMeta) => Array.from({ length: m.height.max - m.height.min + 1 }, (_, i) => m.height.min + i);

function useVitalsMeta() {
  return useResource<VitalsMeta>("/meta/vitals");
}

function Footer({ error, saving, label = "Save" }: { error: string | null; saving: boolean; label?: string }) {
  return (
    <div className="space-y-3 border-t hairline pt-6">
      {error && (
        <p role="alert" className="rounded-2xl bg-error-soft px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" loading={saving} size="lg">
          {label}
        </Button>
      </div>
    </div>
  );
}

async function patch(body: object, onSaved: (p: OwnProfile) => void, setError: (e: string | null) => void) {
  setError(null);
  try {
    onSaved(await api.patch<OwnProfile>("/profiles/me", body));
  } catch (e) {
    setError(e instanceof ApiError ? e.message : "Couldn't save. Please try again.");
  }
}

/** A small "shown / hidden" switch beside each answer. Hidden answers stay private and are never used to filter you. */
function Visibility({ label, hidden, onChange }: { label: string; hidden: boolean; onChange: (hidden: boolean) => void }) {
  return (
    <button
      type="button"
      aria-pressed={!hidden}
      aria-label={`${label}: ${hidden ? "hidden from your profile" : "shown on your profile"}`}
      onClick={() => onChange(!hidden)}
      className={cx("inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition", hidden ? "bg-parchment-deep text-ink-muted" : "bg-rose-mist text-primary-700")}
    >
      <Icon name={hidden ? "lock" : "check"} className="h-3.5 w-3.5" />
      {hidden ? "Hidden" : "Shown"}
    </button>
  );
}

/**
 * The member's vitals. Every one is optional; each can be hidden from the profile. Answers are saved as keys,
 * and labels come from the server so they read the same everywhere.
 */
export function VitalsSection({ profile, onSaved }: { profile: OwnProfile; onSaved: (p: OwnProfile) => void }) {
  const meta = useVitalsMeta();
  const [v, setV] = useState<Vitals>(profile.vitals);
  const [hidden, setHidden] = useState<VitalKey[]>(profile.hiddenVitals);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const m = meta.data;
  if (!m) return <Skeleton className="h-96 rounded-3xl" />;

  const isHidden = (k: VitalKey) => hidden.includes(k);
  const setHiddenFor = (k: VitalKey, h: boolean) => setHidden((list) => (h ? [...new Set([...list, k])] : list.filter((x) => x !== k)));
  const row = (k: VitalKey, field: React.ReactNode) => (
    <div key={k} className="flex items-end gap-3">
      <div className="min-w-0 flex-1">{field}</div>
      <div className="pb-1">
        <Visibility label={m.labels[k]} hidden={isHidden(k)} onChange={(h) => setHiddenFor(k, h)} />
      </div>
    </div>
  );

  return (
    <form
      noValidate
      className="space-y-6"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        await patch({ ...v, jobTitle: v.jobTitle?.trim() || null, hiddenVitals: hidden }, onSaved, setError);
        setSaving(false);
      }}
    >
      <p className="flex items-start gap-2.5 rounded-2xl bg-surface/80 px-4 py-3 text-sm text-ink-soft">
        <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>
          <strong className="font-semibold text-ink">All optional.</strong> Answer only what you're happy to share. A hidden answer stays private: it isn't shown, and nobody can filter you by it.
        </span>
      </p>
      <div className="grid gap-5 md:grid-cols-2">
        {row(
          "height",
          <Select label={m.labels.height} value={v.heightCm ?? ""} onChange={(e) => setV({ ...v, heightCm: e.target.value ? Number(e.target.value) : null })}>
            <option value="">Prefer not to say</option>
            {heights(m).map((cm) => (
              <option key={cm} value={cm}>
                {heightOption(cm)}
              </option>
            ))}
          </Select>,
        )}
        {row("jobTitle", <Input label={m.labels.jobTitle} placeholder="For example, Product designer" maxLength={m.jobTitleMax} value={v.jobTitle ?? ""} onChange={(e) => setV({ ...v, jobTitle: e.target.value })} />)}
        {CHOICES.map((k) =>
          row(
            k,
            <Select label={m.labels[k]} value={v[k] ?? ""} onChange={(e) => setV({ ...v, [k]: e.target.value || null })}>
              <option value="">Prefer not to say</option>
              {m.choices[k].map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>,
          ),
        )}
      </div>
      <Footer error={error} saving={saving} />
    </form>
  );
}

const countActive = (d: Dealbreakers) => FILTERABLE.filter((k) => d[k]?.length).length + (d.heightMinCm || d.heightMaxCm ? 1 : 0);

/**
 * Saved dealbreakers: they narrow who appears in Discover, and only for this member. They're private,
 * and they never hide this member from anyone else.
 */
export function DealbreakersSection({ profile, onSaved }: { profile: OwnProfile; onSaved: (p: OwnProfile) => void }) {
  const meta = useVitalsMeta();
  const [d, setD] = useState<Dealbreakers>(profile.dealbreakers);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const m = meta.data;
  if (!m) return <Skeleton className="h-64 rounded-3xl" />;

  const toggle = (k: ChoiceVital, value: string) => {
    const list = d[k] ?? [];
    setD({ ...d, [k]: list.includes(value) ? list.filter((x) => x !== value) : [...list, value] });
  };
  const heightError = d.heightMinCm && d.heightMaxCm && d.heightMaxCm < d.heightMinCm ? "Must be at least the minimum." : undefined;
  const active = countActive(d);

  return (
    <form
      noValidate
      aria-labelledby="dealbreakers-title"
      className="space-y-7"
      onSubmit={async (e) => {
        e.preventDefault();
        if (heightError) return;
        setSaving(true);
        await patch({ dealbreakers: d }, onSaved, setError);
        setSaving(false);
      }}
    >
      <div>
        <h2 id="dealbreakers-title" className="text-2xl">
          Dealbreakers
        </h2>
        <p className="mt-1 text-sm text-ink-muted">
          Only people who fit these appear in Discover. Leave a group empty if it doesn't matter to you. Private: nobody sees your dealbreakers.
        </p>
      </div>
      <fieldset>
        <legend className="text-sm font-semibold">{m.labels.height}</legend>
        <div className="mt-3 grid grid-cols-2 gap-4">
          {(["heightMinCm", "heightMaxCm"] as const).map((k) => (
            <Select key={k} label={k === "heightMinCm" ? "From" : "To"} error={k === "heightMaxCm" ? heightError : undefined} value={d[k] ?? ""} onChange={(e) => setD({ ...d, [k]: e.target.value ? Number(e.target.value) : undefined })}>
              <option value="">Any</option>
              {heights(m).map((cm) => (
                <option key={cm} value={cm}>
                  {heightOption(cm)}
                </option>
              ))}
            </Select>
          ))}
        </div>
      </fieldset>
      {FILTERABLE.map((k) => (
        <fieldset key={k}>
          <legend className="text-sm font-semibold">{m.labels[k]}</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {m.choices[k].map((o) => (
              <Chip key={o.value} selected={!!d[k]?.includes(o.value)} onToggle={() => toggle(k, o.value)}>
                {o.label}
              </Chip>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="rounded-2xl bg-surface/70 px-4">
        <Toggle
          label="Also show people who haven't said"
          description="Many people leave some of these blank. Turn this off to see only people whose answer fits."
          checked={d.includeUnstated}
          onChange={(includeUnstated) => setD({ ...d, includeUnstated })}
        />
      </div>
      {active > 0 && (
        <p className="text-sm text-ink-muted">
          {active} {active === 1 ? "dealbreaker" : "dealbreakers"} set.{" "}
          <button type="button" className="font-semibold text-primary-text underline-offset-4 hover:underline" onClick={() => setD({ includeUnstated: true })}>
            Clear all
          </button>
        </p>
      )}
      <Footer error={error} saving={saving} label="Save dealbreakers" />
    </form>
  );
}

export const activeDealbreakers = countActive;
