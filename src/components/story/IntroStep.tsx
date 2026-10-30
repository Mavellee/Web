import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { GENDERS } from "../../lib/labels";
import { useAutosave, type SaveStatus } from "../../lib/useAutosave";
import { useResource } from "../../lib/useResource";
import type { Gender, OwnProfile } from "../../lib/types";
import { Chip } from "../ui/Chip";
import { Input, Select, Textarea } from "../ui/Field";
import { Icon } from "../ui/Icon";
import { Skeleton } from "../ui/Skeleton";

const LANGUAGES = ["English", "Hindi", "Bengali", "Marathi", "Telugu", "Tamil", "Gujarati", "Kannada", "Malayalam", "Punjabi", "Urdu", "Odia", "French", "Spanish", "Arabic"];
const BIO_MAX = 500;

type Values = { displayName: string; gender: string; interestedIn: string[]; city: string; bio: string; languages: string[] };
export type IntroDraft = Partial<Pick<OwnProfile, "displayName" | "bio" | "city" | "languages">>;
export type IntroHandle = { submit: () => Promise<boolean> };

const fromProfile = (p: OwnProfile): Values => ({ displayName: p.displayName, gender: p.gender ?? "", interestedIn: p.interestedIn, city: p.city ?? "", bio: p.bio ?? "", languages: p.languages });
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
  const cities = useResource<{ name: string; region: string }[]>("/meta/cities");
  const [v, setV] = useState<Values>(() => (!profile.displayName && readDraft(userId)) || fromProfile(profile));
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [locState, setLocState] = useState<string | null>(null);
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
      const city = val.city !== (latestProfile.current.city ?? "") ? { city: val.city || null } : {}; // re-sending the city would overwrite an approximate location
      onSaved(await api.patch<OwnProfile>("/profiles/me", { displayName: val.displayName.trim(), gender: val.gender, interestedIn: val.interestedIn, bio: val.bio.trim() || null, languages: val.languages, ...city }));
      writeDraft(userId, null);
    },
    { enabled: canSave, baseline: fromProfile(profile), onStatus },
  );

  useEffect(() => {
    onDraft({ displayName: v.displayName, bio: v.bio, city: v.city || null, languages: v.languages });
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

  const useLocation = () => {
    if (!navigator.geolocation) return setLocState("Location isn't available in this browser.");
    setLocState("Finding your approximate area…");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // Rounded here as well as on the server; precise coordinates never leave the device.
        const approx = { lat: Math.round(pos.coords.latitude * 100) / 100, lon: Math.round(pos.coords.longitude * 100) / 100 };
        if (!latestProfile.current.displayName) return setLocState("Add your name first, then try this again.");
        try {
          onSaved(await api.patch<OwnProfile>("/profiles/me", { approxLocation: approx }));
          setLocState("Approximate area saved (about 1 km precision). Others only see a distance range.");
        } catch (err) {
          setLocState(err instanceof ApiError ? err.message : "Couldn't save your location.");
        }
      },
      () => setLocState("We couldn't get your location. Your chosen city will be used instead."),
      { enableHighAccuracy: false, timeout: 8000 },
    );
  };

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
      <div className="space-y-2">
        {cities.data ? (
          <Select label="Where are you based?" optional hint="Others see your city and a distance range, never your exact location." value={v.city} onChange={(e) => set("city", e.target.value)}>
            <option value="">Choose your city…</option>
            {cities.data.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}, {c.region}
              </option>
            ))}
          </Select>
        ) : (
          <Skeleton className="h-20" />
        )}
        <button type="button" onClick={useLocation} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          <Icon name="location" className="h-4 w-4" /> Use my approximate location for distance
        </button>
        {locState && (
          <p role="status" className="text-sm text-ink-muted">
            {locState}
          </p>
        )}
      </div>
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
