import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { z } from "zod";
import { api, ApiError } from "../../lib/api";
import { GENDERS, INTENTIONS } from "../../lib/labels";
import { useAutosave, type SaveStatus } from "../../lib/useAutosave";
import { useResource } from "../../lib/useResource";
import type { Gender, Intention, OwnProfile } from "../../lib/types";
import { Button } from "../ui/Button";
import { Chip } from "../ui/Chip";
import { Input, Select, Textarea } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { cx } from "../../lib/format";

const LANGUAGES = ["English", "Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu", "Odia", "French", "Spanish", "Arabic"];

interface SectionProps {
  profile: OwnProfile;
  onSaved: (p: OwnProfile) => void;
  submitLabel?: string;
  secondary?: React.ReactNode;
  /** Hide fields that another step handles (their saved values are kept). */
  show?: { bio?: boolean; interests?: boolean };
}

function useSave(onSaved: (p: OwnProfile) => void) {
  const [error, setError] = useState<string | null>(null);
  const save = async (body: object) => {
    setError(null);
    try {
      onSaved(await api.patch<OwnProfile>("/profiles/me", body));
      return true;
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't save. Please try again.");
      return false;
    }
  };
  return { error, save };
}

function ChipGroup<T extends string>({ label, options, value, onChange, hint, error }: { label: string; options: { value: T; label: string }[]; value: T[]; onChange: (v: T[]) => void; hint?: string; error?: string }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      {hint && <p className="mt-0.5 text-sm text-ink-muted">{hint}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o.value} selected={value.includes(o.value)} onToggle={() => onChange(value.includes(o.value) ? value.filter((x) => x !== o.value) : [...value, o.value])}>
            {o.label}
          </Chip>
        ))}
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-error">
          {error}
        </p>
      )}
    </fieldset>
  );
}

const basicsSchema = z.object({
  displayName: z.string().trim().min(1, "Add the name you'd like people to see.").max(40),
  gender: z.string().min(1, "Choose the option that fits you best."),
  interestedIn: z.array(z.string()).min(1, "Choose at least one."),
  bio: z.string().max(500, "Keep it under 500 characters."),
  languages: z.array(z.string()).max(8),
  interests: z.array(z.string()).max(12, "Choose up to 12."),
});
type Basics = z.infer<typeof basicsSchema>;

export function BasicsSection({ profile, onSaved, submitLabel = "Save", secondary, show = {} }: SectionProps) {
  const showBio = show.bio !== false;
  const showInterests = show.interests !== false;
  const interests = useResource<{ slug: string; name: string; category: string }[]>("/meta/interests");
  const { error, save } = useSave(onSaved);
  const { register, control, handleSubmit, watch, formState } = useForm<Basics>({
    resolver: zodResolver(basicsSchema),
    defaultValues: {
      displayName: profile.displayName,
      gender: profile.gender ?? "",
      interestedIn: profile.interestedIn,
      bio: profile.bio ?? "",
      languages: profile.languages,
      interests: profile.interests,
    },
  });
  const bio = watch("bio") ?? "";

  const byCategory = (interests.data ?? []).reduce<Record<string, { slug: string; name: string }[]>>((acc, i) => {
    (acc[i.category] ??= []).push(i);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit((v) => save({ ...v, bio: v.bio || null }))} noValidate className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input label="Display name" autoComplete="given-name" error={formState.errors.displayName?.message} {...register("displayName")} />
        <Select label="Gender" error={formState.errors.gender?.message} {...register("gender")}>
          <option value="">Choose…</option>
          {GENDERS.map((g) => (
            <option key={g.value} value={g.value}>
              {g.label}
            </option>
          ))}
        </Select>
      </div>
      <Controller
        control={control}
        name="interestedIn"
        render={({ field, fieldState }) => (
          <ChipGroup<Gender> label="I'd like to meet" hint="Choose all that apply." options={GENDERS} value={field.value as Gender[]} onChange={field.onChange} error={fieldState.error?.message} />
        )}
      />
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-surface/70 px-4 py-3 text-sm">
        <Icon name="location" className="h-4 w-4 text-primary-text" />
        <span className="font-semibold">{profile.city ?? (profile.hasApproxLocation ? "Approximate area set" : "No location set")}</span>
        <Link to="/app/settings#location" className="font-semibold text-primary-text underline-offset-4 hover:underline">
          {profile.city || profile.hasApproxLocation ? "Change in Settings" : "Set it in Settings"}
        </Link>
      </p>
      {showBio && <Textarea label="In a sentence or two" optional placeholder="A short line about you. Prompts do the rest." hint={`${bio.length}/500`} error={formState.errors.bio?.message} {...register("bio")} />}
      <Controller
        control={control}
        name="languages"
        render={({ field }) => <ChipGroup label="Languages you speak" options={LANGUAGES.map((l) => ({ value: l, label: l }))} value={field.value} onChange={field.onChange} />}
      />
      {showInterests && (
      <Controller
        control={control}
        name="interests"
        render={({ field, fieldState }) => (
          <fieldset>
            <legend className="text-sm font-semibold">Interests</legend>
            <p className="mt-0.5 text-sm text-ink-muted">Pick up to 12. Shared interests are highlighted on profiles.</p>
            {fieldState.error && (
              <p role="alert" className="mt-2 text-sm text-error">
                {fieldState.error.message}
              </p>
            )}
            <div className="mt-4 space-y-4">
              {Object.entries(byCategory).map(([cat, list]) => (
                <div key={cat}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-muted">{cat}</p>
                  <div className="flex flex-wrap gap-2">
                    {list.map((i) => (
                      <Chip key={i.slug} selected={field.value.includes(i.slug)} onToggle={() => field.onChange(field.value.includes(i.slug) ? field.value.filter((x) => x !== i.slug) : [...field.value, i.slug])}>
                        {i.name}
                      </Chip>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>
        )}
      />
      )}
      <FormFooter error={error} submitting={formState.isSubmitting} submitLabel={submitLabel} secondary={secondary} />
    </form>
  );
}

export function IntentionSection({ profile, onSaved, submitLabel = "Save", secondary, autosave = false, onStatus }: SectionProps & { autosave?: boolean; onStatus?: (s: SaveStatus, retry?: () => void) => void }) {
  const [selected, setSelected] = useState<Intention[]>(profile.intentions);
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const { error, save } = useSave(onSaved);
  const toggle = (v: Intention) => setSelected((s) => (s.includes(v) ? s.filter((x) => x !== v) : [...s, v]));
  useAutosave(selected, async (v) => onSaved(await api.patch<OwnProfile>("/profiles/me", { intentions: v })), { enabled: autosave && selected.length > 0, delay: 500, baseline: profile.intentions, onStatus });

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!selected.length) return setLocalError("Choose at least one intention.");
        setLocalError(null);
        setSubmitting(true);
        await save({ intentions: selected });
        setSubmitting(false);
      }}
      className="space-y-6"
    >
      <fieldset>
        <legend className="sr-only">What are you open to right now?</legend>
        <div className="grid gap-3">
          {INTENTIONS.map((i) => {
            const on = selected.includes(i.value);
            return (
              <button
                key={i.value}
                type="button"
                role="checkbox"
                aria-checked={on}
                onClick={() => toggle(i.value)}
                className={cx("flex items-center gap-4 rounded-[1.75rem] border px-5 py-3.5 text-left transition", on ? "border-primary bg-primary text-surface shadow-soft" : "border-line bg-surface/80 text-ink hover:border-primary/40")}
              >
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{i.title}</span>
                  <span className={cx("mt-0.5 block text-sm", on ? "text-surface/80" : "text-ink-muted")}>{i.description}</span>
                </span>
                <span className={cx("flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2", on ? "border-surface bg-surface text-primary" : "border-line-strong")}>{on && <Icon name="check" className="h-4 w-4" />}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
      <p className="text-sm text-ink-muted">You can choose more than one, and change this any time. It's shown on your profile.</p>
      {autosave ? profile.intentions.length > 0 && !selected.length && <p className="text-sm text-ink-muted">Keep at least one selected. Your last choice stays saved until you pick another.</p> : <FormFooter error={localError ?? error} submitting={submitting} submitLabel={submitLabel} secondary={secondary} />}
    </form>
  );
}

const DISTANCES = [
  { value: "5", label: "Within 5 km" },
  { value: "10", label: "Within 10 km" },
  { value: "25", label: "Within 25 km" },
  { value: "50", label: "Within 50 km" },
  { value: "100", label: "Within 100 km" },
  { value: "", label: "Anywhere" },
];

export function PreferencesSection({ profile, onSaved, submitLabel = "Save", secondary }: SectionProps) {
  const { error, save } = useSave(onSaved);
  const schema = z
    .object({ ageMin: z.coerce.number().int().min(18, "Minimum is 18.").max(100), ageMax: z.coerce.number().int().min(18).max(100), maxDistanceKm: z.string(), soughtIntentions: z.array(z.string()) })
    .refine((v) => v.ageMax >= v.ageMin, { message: "Must be at least the minimum age.", path: ["ageMax"] });
  type V = z.infer<typeof schema>;
  const { register, control, handleSubmit, formState } = useForm<V>({
    resolver: zodResolver(schema),
    defaultValues: { ageMin: profile.ageMin, ageMax: profile.ageMax, maxDistanceKm: profile.maxDistanceKm ? String(profile.maxDistanceKm) : "", soughtIntentions: profile.soughtIntentions },
  });
  return (
    <form
      onSubmit={handleSubmit((v) => save({ ageMin: v.ageMin, ageMax: v.ageMax, maxDistanceKm: v.maxDistanceKm ? Number(v.maxDistanceKm) : null, soughtIntentions: v.soughtIntentions }))}
      noValidate
      className="space-y-7"
    >
      <fieldset>
        <legend className="text-sm font-semibold">Age range</legend>
        <div className="mt-3 grid grid-cols-2 gap-4">
          <Input label="From" type="number" inputMode="numeric" min={18} max={100} error={formState.errors.ageMin?.message} {...register("ageMin")} />
          <Input label="To" type="number" inputMode="numeric" min={18} max={100} error={formState.errors.ageMax?.message} {...register("ageMax")} />
        </div>
      </fieldset>
      <Select label="Distance" hint={profile.city || profile.hasApproxLocation ? "Measured on our servers from your place. Nobody sees where you are." : "Set your location in Settings to use distance."} {...register("maxDistanceKm")}>
        {DISTANCES.map((d) => (
          <option key={d.label} value={d.value}>
            {d.label}
          </option>
        ))}
      </Select>
      <Controller
        control={control}
        name="soughtIntentions"
        render={({ field }) => (
          <ChipGroup<Intention>
            label="Show me people who are open to"
            hint="Leave empty to use your own intentions."
            options={INTENTIONS.map((i) => ({ value: i.value, label: i.title }))}
            value={field.value as Intention[]}
            onChange={field.onChange}
          />
        )}
      />
      <FormFooter error={error} submitting={formState.isSubmitting} submitLabel={submitLabel} secondary={secondary} />
    </form>
  );
}

function FormFooter({ error, submitting, submitLabel, secondary }: { error: string | null; submitting: boolean; submitLabel: string; secondary?: React.ReactNode }) {
  return (
    <div className="space-y-3 border-t hairline pt-6">
      {error && (
        <p role="alert" className="rounded-2xl bg-error-soft px-4 py-3 text-sm text-error">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {secondary ?? <span />}
        <Button type="submit" loading={submitting} size="lg">
          {submitLabel}
        </Button>
      </div>
    </div>
  );
}
