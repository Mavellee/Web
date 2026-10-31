import { useMemo, useState } from "react";
import { api, ApiError } from "../../lib/api";
import type { AstroState } from "../../lib/astro";
import { useResource } from "../../lib/useResource";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Field";
import { Icon } from "../ui/Icon";

type Place = { id: string; city: string; region: string; country: string };
type Accuracy = "EXACT" | "APPROXIMATE" | "UNKNOWN";

/** One person's own birth details and consent. Nothing here is ever shown to the match. */
export function AstroConsentForm({ matchId, hasSaved, defaultDate, onDone }: { matchId: string; hasSaved: boolean; defaultDate?: string | null; onDone: (s: AstroState) => void }) {
  const places = useResource<Place[]>("/astro/places");
  const [date, setDate] = useState(defaultDate ?? "");
  const [accuracy, setAccuracy] = useState<Accuracy>("EXACT");
  const [time, setTime] = useState("");
  const [country, setCountry] = useState("India");
  const [placeId, setPlaceId] = useState("");
  const [consent, setConsent] = useState(false);
  const [externalAi, setExternalAi] = useState(false);
  const [useInterests, setUseInterests] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const countries = useMemo(() => [...new Set((places.data ?? []).map((p) => p.country))].sort(), [places.data]);
  const cities = (places.data ?? []).filter((p) => p.country === country);
  const ready = consent && (hasSaved || (date && placeId && (accuracy === "UNKNOWN" || time)));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const birth = hasSaved ? undefined : { date, time: accuracy === "UNKNOWN" ? null : time, accuracy, placeId };
      onDone(await api.post<AstroState>(`/astro/matches/${matchId}/consent`, { birth, shareSummary: true, externalAi, useInterests }));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "That didn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <p className="flex gap-2.5 rounded-2xl bg-surface/80 px-4 py-3 text-sm text-ink-soft">
        <Icon name="lock" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <span>We use these details only to calculate your chart. They're encrypted, and your match never sees your date, time or place of birth.</span>
      </p>
      {hasSaved ? (
        <p className="text-sm text-ink-soft">We'll use the birth details you already saved. To change them, delete your astrology data in Settings first.</p>
      ) : (
        <>
          <Input label="Date of birth" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          <fieldset>
            <legend className="text-sm font-semibold">How well do you know your birth time?</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {(
                [
                  ["EXACT", "Exact"],
                  ["APPROXIMATE", "Roughly"],
                  ["UNKNOWN", "I don't know"],
                ] as const
              ).map(([v, label]) => (
                <button key={v} type="button" aria-pressed={accuracy === v} onClick={() => setAccuracy(v)} className={`min-h-11 rounded-full border px-4 text-sm font-medium transition ${accuracy === v ? "border-primary bg-primary text-surface" : "border-line bg-surface/80 text-ink-soft hover:border-primary/40"}`}>
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-sm text-ink-muted">{accuracy === "EXACT" ? "This gives the fullest reading, including your rising sign." : accuracy === "APPROXIMATE" ? "We'll only report what holds an hour either side of this time." : "That's fine. We never guess a time, so your rising sign and houses are left out, and some Moon details may be too."}</p>
          </fieldset>
          {accuracy !== "UNKNOWN" && <Input label="Birth time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />}
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Country of birth"
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setPlaceId("");
              }}
            >
              {countries.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <Select label="City of birth" hint="Choose the nearest city on the list." value={placeId} onChange={(e) => setPlaceId(e.target.value)}>
              <option value="">Choose…</option>
              {cities.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.city}
                  {p.region && `, ${p.region}`}
                </option>
              ))}
            </Select>
          </div>
        </>
      )}
      <div className="space-y-3 rounded-3xl border hairline bg-surface/70 p-5 text-sm">
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-primary" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            <strong className="font-semibold">Calculate my chart and share a summary with my match.</strong> They'll see my Sun sign, Moon sign, nakshatra and rising sign, if known. <span className="text-ink-muted">Required to continue.</span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-primary" checked={externalAi} onChange={(e) => setExternalAi(e.target.checked)} />
          <span>
            <strong className="font-semibold">Let an AI write our reading.</strong> Sign-level results go to an external AI provider, without names or birth details. <span className="text-ink-muted">Optional. Both of you must agree; otherwise you see the calculated report only.</span>
          </span>
        </label>
        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-0.5 h-5 w-5 accent-primary" checked={useInterests} onChange={(e) => setUseInterests(e.target.checked)} />
          <span>
            <strong className="font-semibold">Include the interests we share.</strong> <span className="text-ink-muted">Optional.</span>
          </span>
        </label>
      </div>
      <p className="text-xs text-ink-muted">You can withdraw and delete this data at any time. Unused birth details are removed automatically. Astrology is a tradition to reflect on, not a scientific assessment.</p>
      {error && (
        <p role="alert" className="text-sm text-error">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!ready} loading={busy}>
        Send to Mavelle Astro
      </Button>
    </form>
  );
}
