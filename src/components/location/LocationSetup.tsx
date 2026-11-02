import { useState } from "react";
import { api, ApiError } from "../../lib/api";
import { currentPosition, PositionError, placeLabel, type LocationView, type Place } from "../../lib/location";
import { cx } from "../../lib/format";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { PlaceSearch } from "./PlaceSearch";

type Step = "choose" | "explain" | "locating" | "manual";

/**
 * "Where are you looking for connection?" Device location is asked for only after the member picks it and reads
 * what we keep; choosing a place by hand always works, and skipping is always allowed.
 */
export function LocationSetup({ value, onChange, onSkip, heading = true }: { value: LocationView | null; onChange: (v: LocationView) => void; onSkip?: () => void; heading?: boolean }) {
  const [step, setStep] = useState<Step>("choose");
  const [problem, setProblem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const save = async (body: object) => {
    setBusy(true);
    setProblem(null);
    try {
      onChange(await api.put<LocationView>("/location/me", body));
      setStep("choose");
    } catch (e) {
      setProblem(e instanceof ApiError ? e.message : "That didn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const shareDevice = async () => {
    setStep("locating");
    setProblem(null);
    try {
      const { lat, lon } = await currentPosition();
      await save({ source: "DEVICE", lat, lon, consent: true });
    } catch (e) {
      setProblem(e instanceof PositionError ? e.message : "We couldn't get your location. Choose your place by hand instead.");
      setStep("manual");
    }
  };

  const chosen = value?.hasLocation ? placeLabel(value) || "Your approximate area" : null;

  return (
    <section aria-label="Your location" className={cx(heading ? "rounded-[1.75rem] border hairline bg-surface/75 p-5 shadow-soft sm:p-7" : "[&>*:first-child]:mt-0")}>
      {heading && (
        <>
          <p className="eyebrow">Location</p>
          <h2 className="mt-2 font-serif text-2xl leading-tight sm:text-[1.75rem]">Where are you looking for connection?</h2>
          <p className="mt-2 text-ink-soft">Set your location to discover people around you. Your exact location is always private.</p>
        </>
      )}

      {chosen && step === "choose" && (
        <p className="mt-5 flex items-center gap-2 rounded-2xl bg-rose-mist/70 px-4 py-3 text-sm">
          <Icon name="location" className="h-4 w-4 shrink-0 text-primary-text" />
          <span>
            <span className="font-semibold">{chosen}</span>
            <span className="text-ink-muted"> · {value?.source === "DEVICE" ? "from your device, rounded to about 1 km" : "chosen by you"}</span>
          </span>
        </p>
      )}

      {step === "choose" && (
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
          <Button onClick={() => setStep("explain")} icon={<Icon name="location" className="h-4 w-4" />}>
            {chosen ? "Update with my current location" : "Use my current location"}
          </Button>
          <Button variant="secondary" onClick={() => setStep("manual")}>
            Choose location manually
          </Button>
          {onSkip && !chosen && (
            <button type="button" onClick={onSkip} className="min-h-10 text-sm font-semibold text-ink-muted underline-offset-4 hover:text-ink hover:underline sm:col-span-2">
              Skip for now
            </button>
          )}
        </div>
      )}

      {step === "explain" && (
        <div className="mt-5 rounded-2xl bg-rose-soft/70 p-5">
          <p className="font-semibold">Before your browser asks</p>
          <ul className="mt-2 space-y-1.5 text-sm text-ink-soft">
            <li>We ask once, only now. Mavelle never tracks you in the background.</li>
            <li>Your position is rounded to about 1 km before it's saved, and nobody, including your matches, ever sees it.</li>
            <li>Others see only a range, like “Within 5 km”. You can hide even that, or remove your location any time in Settings.</li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button onClick={() => void shareDevice()}>Allow and continue</Button>
            <Button variant="quiet" onClick={() => setStep("choose")}>
              Not now
            </Button>
          </div>
        </div>
      )}

      {step === "locating" && (
        <p role="status" className="mt-5 text-sm text-ink-muted">
          Finding your approximate area…
        </p>
      )}

      {step === "manual" && (
        <div className="mt-5 space-y-3">
          <PlaceSearch autoFocus busy={busy} onPick={(p: Place) => void save({ source: "MANUAL", placeId: p.id })} />
          <button type="button" onClick={() => (setStep("choose"), setProblem(null))} className="text-sm font-semibold text-ink-muted hover:text-ink">
            Back
          </button>
        </div>
      )}

      {problem && (
        <p role="alert" className="mt-4 text-sm text-error">
          {problem}
        </p>
      )}
    </section>
  );
}
