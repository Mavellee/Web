import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { api } from "../../lib/api";
import { GENDERS } from "../../lib/labels";
import { useAutosave, type SaveStatus } from "../../lib/useAutosave";
import { useResource } from "../../lib/useResource";
import type { Gender, OwnProfile } from "../../lib/types";
import { Chip } from "../ui/Chip";
import { Input, Select, Textarea } from "../ui/Field";
import { LocationSetup } from "../location/LocationSetup";
import type { LocationView } from "../../lib/location";
import { Skeleton } from "../ui/Skeleton";

const LANGUAGES = ["English", "Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu", "Odia", "French", "Spanish", "Arabic"];
const BIO_MAX = 500;

type Values = { displayName: string; gender: string; interestedIn: string[]; bio: string; languages: string[] };
export type IntroDraft = Partial<Pick<OwnProfile, "displayName" | "bio" | "city" | "languages">>;
export type IntroHandle = { submit: () => Promise<boolean> };

const fromProfile = (p: OwnProfile): Values => ({ displayName: p.displayName, gender: p.gender ?? "", interestedIn: p.interestedIn, bio: p.bio ?? "", languages: p.languages });
const draftKey = (id: string) => `knot:intro-draft:${id}`;
const readDraft = (id: string): Values | null => {
  try {
    const raw = localStorage.getItem(draftKey(id));
    return raw ? (JSON.parse(raw) as Values) : null;
  } catch {
    return null;
  }
};
const writeDraft = (id: string, v: Values | null) => {
  try {
    if (v) localStorage.setItem(draftKey(id), JSON.stringify(v));
    else localStorage.removeItem(draftKey(id));
  } catch {
    /* private mode: the draft just isn't kept */
  }
};

/**
 * The Introduction, as a conversation. Saves itself once it has what's needed to create a profile (a name,
 * gender and who you'd like to meet); until then the draft is kept on this device so nothing is lost.
 */
export const IntroStep = forwardRef<IntroHandle, { profile: OwnProfile; userId: string; onSaved: (p: OwnProfile) => void; onDraft: (d: IntroDraft) => void; onStatus: (s: SaveStatus, retry?: () => void) => void }>(function IntroStep({ profile, userId, onSaved, onDraft, onStatus }, ref) {
  const location = useResource<LocationView>(profile.displayName ? "/location/me" : null);
  const [v, setV] = useState<Values>(() => (!profile.displayName && readDraft(userId)) || fromProfile(profile));
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [locationSkipped, setLocationSkipped] = useState(false);
  const latestProfile = useRef(profile);
  latestProfile.current = profile;
  const set = <K extends keyof Values>(k: K, val: Values[K]) => {
    setV((o) => ({ ...o, [k]: val }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const canSave = !!v.displayName.trim() && !!v.gender && v.interestedIn.length > 0 && v.bio.length <= BIO_MAX;

  const { flush } = useAutosave(
    v,
    async (val) => {
      onSaved(await api.patch<OwnProfile>("/profiles/me", { displayName: val.displayName.trim(), gender: val.gender, interestedIn: val.interestedIn, bio: val.bio.trim() || null, languages: val.languages }));
      writeDraft(userId, null);
    },
    { enabled: canSave, baseline: fromProfile(profile), onStatus },
  );

  useEffect(() => {
    onDraft({ displayName: v.displayName, bio: v.bio, city: latestProfile.current.city, languages: v.languages });
    if (!canSave && !profile.displayName && (v.displayName || v.gender || v.bio)) {
      writeDraft(userId, v);
      onStatus("local");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [v]);

  useImperativeHandle(ref, () => ({
    submit: async () => {
      const e: typeof errors = {};
      if (!v.displayName.trim()) e.displayName = "Add the name you'd like people to see.";
      if (!v.gender) e.gender = "Choose the option that fits you best.";
      if (!v.interestedIn.length) e.interestedIn = "Choose at least one.";
      if (v.bio.length > BIO_MAX) e.bio = `Keep it under ${BIO_MAX} characters.`;
      setErrors(e);
      if (Object.keys(e).length) return false;
      return flush();
    },
  }));

  return (
    <div className="max-w-xl space-y-9">
      {profile.dateOfBirth && (
        <p className="rounded-2xl bg-surface/70 px-4 py-3 text-sm text-ink-soft">
          You told us your date of birth when you joined. Others only ever see your age{profile.age != null && <> ({profile.age})</>}, never the date. Contact support if it's wrong.
        </p>
      )}
      <Input label="What should we call you?" autoComplete="given-name" maxLength={40} placeholder="Your first name" value={v.displayName} onChange={(e) => set("displayName", e.target.value)} error={errors.displayName} />
      <Select label="How do you describe yourself?" value={v.gender} onChange={(e) => set("gender", e.target.value)} error={errors.gender}>
        <option value="">Choose…</option>
        {GENDERS.map((g) => (
          <option key={g.value} value={g.value}>
            {g.label}
          </option>
        ))}
      </Select>
      <fieldset>
        <legend className="text-sm font-semibold">Who would you like to meet?</legend>
        <p className="mt-0.5 text-sm text-ink-muted">Choose all that apply.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <Chip key={g.value} selected={v.interestedIn.includes(g.value)} onToggle={() => set("interestedIn", v.interestedIn.includes(g.value) ? v.interestedIn.filter((x) => x !== g.value) : [...v.interestedIn, g.value as Gender])}>
              {g.label}
            </Chip>
          ))}
        </div>
        {errors.interestedIn && (
          <p role="alert" className="mt-2 text-sm text-error">
            {errors.interestedIn}
          </p>
        )}
      </fieldset>
      {!profile.displayName ? (
        <p className="rounded-2xl bg-surface/70 px-4 py-3 text-sm text-ink-soft">Once you've added your name and who you'd like to meet, you can set where you're looking for connection. It's optional.</p>
      ) : locationSkipped && !location.data?.hasLocation ? (
        <p className="text-sm text-ink-muted">
          No location for now. Discover will show people anywhere.{" "}
          <button type="button" className="font-semibold text-primary-text underline-offset-4 hover:underline" onClick={() => setLocationSkipped(false)}>
            Set it now
          </button>
        </p>
      ) : location.data ? (
        <LocationSetup
          value={location.data}
          onSkip={() => setLocationSkipped(true)}
          onChange={async (view) => {
            location.setData(view);
            onSaved(await api.get<OwnProfile>("/profiles/me"));
          }}
        />
      ) : (
        <Skeleton className="h-48" />
      )}
      <Textarea label="Tell us a little about yourself." optional rows={3} placeholder="How would your friends describe you?" hint={`${v.bio.length}/${BIO_MAX}`} value={v.bio} onChange={(e) => set("bio", e.target.value)} error={errors.bio} />
      <fieldset>
        <legend className="text-sm font-semibold">
          Which languages do you speak? <span className="font-normal text-ink-muted">Optional</span>
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {LANGUAGES.map((l) => (
            <Chip key={l} selected={v.languages.includes(l)} disabled={!v.languages.includes(l) && v.languages.length >= 8} onToggle={() => set("languages", v.languages.includes(l) ? v.languages.filter((x) => x !== l) : [...v.languages, l])}>
              {l}
            </Chip>
          ))}
        </div>
      </fieldset>
    </div>
  );
});
