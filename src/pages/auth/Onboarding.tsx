import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../../components/ui/Logo";
import { Button } from "../../components/ui/Button";
import { Drawer } from "../../components/ui/Drawer";
import { Icon } from "../../components/ui/Icon";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { BasicsSection, IntentionSection, PreferencesSection } from "../../components/profile/ProfileSections";
import { QuestionCard, type Question } from "../../components/compat/QuestionCard";
import { PhotoWorkspace } from "../../components/story/PhotoWorkspace";
import { PromptWriter } from "../../components/story/PromptWriter";
import { InterestPicker } from "../../components/story/InterestPicker";
import { EditorialProfile } from "../../components/story/EditorialProfile";
import { StoryPreviewCard, toPreview } from "../../components/story/StoryPreview";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useResource } from "../../lib/useResource";
import { cx } from "../../lib/format";
import type { OwnProfile } from "../../lib/types";

const STEPS = [
  { key: "intro", title: "Your introduction", short: "Intro" },
  { key: "photos", title: "Your photographs", short: "Photos" },
  { key: "words", title: "More than a bio", short: "Your words" },
  { key: "connection", title: "My kind of connection", short: "Connection" },
  { key: "little", title: "The little things", short: "Little things" },
  { key: "preview", title: "Preview your story", short: "Preview" },
] as const;
type StepKey = (typeof STEPS)[number]["key"];

/** Resume where the saved data ends. */
function firstIncomplete(p: OwnProfile): StepKey {
  if (!p.displayName || !p.gender || !p.city || !p.interestedIn.length) return "intro";
  if (!p.photos.length) return "photos";
  if (!p.prompts.length && !p.bio) return "words";
  if (!p.intentions.length) return "connection";
  if (p.interests.length < 3) return "little";
  return "preview";
}

export function Onboarding() {
  const { data, error, loading, reload, setData } = useResource<OwnProfile>("/profiles/me");
  const interests = useResource<{ slug: string; name: string }[]>("/meta/interests");
  const { account } = useAuth();
  const [step, setStep] = useState<StepKey | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    if (data && !step) setStep(firstIncomplete(data));
  }, [data, step]);

  const index = step ? STEPS.findIndex((s) => s.key === step) : 0;
  // Any step up to the furthest point the saved data supports can be revisited directly.
  const reachable = data ? Math.max(index, STEPS.findIndex((s) => s.key === firstIncomplete(data))) : 0;
  const go = (k: StepKey) => {
    setStep(k);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const saved = (p: OwnProfile, nextStep?: StepKey) => {
    setData(p);
    setSavedAt(new Date());
    if (nextStep) go(nextStep);
  };
  const preview = useMemo(() => (data ? toPreview(data, account?.id ?? "me", interests.data ?? []) : null), [data, account?.id, interests.data]);
  const back = (k: StepKey) => (
    <Button variant="quiet" onClick={() => go(k)}>
      Back
    </Button>
  );

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b hairline bg-ivory/90 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-4 py-4">
          <Logo />
          <div className="flex items-center gap-3 text-sm">
            <SaveIndicator at={savedAt} />
            {step !== "preview" && preview && (
              <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setPreviewOpen(true)} icon={<Icon name="eye" className="h-4 w-4" />}>
                Preview
              </Button>
            )}
          </div>
        </div>
        <nav aria-label="Your story progress" className="container-page pb-3">
          <ol className="grid grid-cols-6 gap-1.5">
            {STEPS.map((s, i) => (
              <li key={s.key}>
                <button
                  type="button"
                  disabled={!data || i > reachable}
                  onClick={() => go(s.key)}
                  aria-current={s.key === step ? "step" : undefined}
                  className="group block w-full text-left disabled:cursor-default"
                >
                  <span className={cx("block h-1 rounded-full transition-colors duration-500", i <= index ? "bg-plum" : i <= reachable ? "bg-plum-200" : "bg-[#EADFD4]")} />
                  <span className={cx("mt-1.5 hidden truncate text-xs font-semibold md:block", s.key === step ? "text-plum" : "text-ink-muted")}>{s.short}</span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <div className={cx("container-page grid gap-12 py-10", step !== "preview" && "lg:grid-cols-[minmax(0,1fr)_20rem]")}>
        <main id="main" className="min-w-0">
          {loading && !data && <LoadingBlock label="Loading your story" />}
          {error && <ErrorState message={error.message} onRetry={reload} />}
          {data && step && (
            <div key={step} className="animate-rise">
              <p className="eyebrow">
                Your story · {index + 1} of {STEPS.length}
              </p>
              {step === "intro" && (
                <Step title="Let's start with hello." lede="The basics people see first. You can change any of this later.">
                  <DobNote profile={data} />
                  <BasicsSection profile={data} submitLabel="Save & continue" show={{ bio: false, interests: false }} onSaved={(p) => saved(p, "photos")} />
                </Step>
              )}
              {step === "photos" && (
                <Step title="Show your world." lede="Your first photo is the one people see first. Drag to reorder and adjust how each one is framed.">
                  <PhotoWorkspace photos={data.photos} onChange={() => (void reload(), setSavedAt(new Date()))} />
                  <Nav back={back("intro")} next={<Button size="lg" disabled={!data.photos.length} onClick={() => go("words")}>Continue</Button>} hint={!data.photos.length ? "Add at least one photo of yourself to continue." : undefined} />
                </Step>
              )}
              {step === "words" && (
                <Step title="More than a bio." lede="Pick a few prompts and answer in your own words. These are often what people respond to first.">
                  <PromptWriter answers={data.prompts} onSaved={(p) => saved(p)} />
                  <div className="mt-10 max-w-xl">
                    <BasicsSection profile={data} submitLabel="Save & continue" show={{ interests: false }} secondary={back("photos")} onSaved={(p) => saved(p, "connection")} />
                  </div>
                </Step>
              )}
              {step === "connection" && (
                <Step title="My kind of connection." lede="What you're open to right now, and who you'd like to meet. It's a preference, never a label.">
                  <IntentionSection profile={data} submitLabel="Save intentions" onSaved={(p) => saved(p)} />
                  <div className="mt-12">
                    <h2 className="text-2xl">Who you'd like to meet</h2>
                    <div className="mt-6">
                      <PreferencesSection profile={data} submitLabel="Save & continue" secondary={back("words")} onSaved={(p) => saved(p, "little")} />
                    </div>
                  </div>
                  <ValuesQuestions />
                </Step>
              )}
              {step === "little" && (
                <Step title="The little things." lede="Music, food, weekends, the topics you love. Shared ones are highlighted for people who have them too.">
                  <InterestPicker selected={data.interests} submitLabel="Save & continue" secondary={back("connection")} onSaved={(p) => saved(p, "preview")} />
                </Step>
              )}
              {step === "preview" && preview && <PreviewStep profile={data} preview={preview} onEdit={go} />}
            </div>
          )}
        </main>
        {step !== "preview" && preview && (
          <aside className="hidden lg:block" aria-label="Live preview">
            <div className="sticky top-36">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Live preview</p>
              <StoryPreviewCard profile={preview} />
            </div>
          </aside>
        )}
      </div>
      <Drawer open={previewOpen} onClose={() => setPreviewOpen(false)} title="Your profile so far">
        <div className="p-5">{preview && <EditorialProfile profile={preview} preview />}</div>
      </Drawer>
    </div>
  );
}

function Step({ title, lede, children }: { title: string; lede?: string; children: ReactNode }) {
  return (
    <section>
      <h1 className="mt-3 text-4xl sm:text-5xl">{title}</h1>
      {lede && <p className="mt-3 max-w-2xl text-lg text-ink-soft">{lede}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}

function Nav({ back, next, hint }: { back: ReactNode; next: ReactNode; hint?: string }) {
  return (
    <div className="mt-10 border-t hairline pt-6">
      {hint && <p className="mb-3 text-sm text-ink-muted">{hint}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {back}
        {next}
      </div>
    </div>
  );
}

function SaveIndicator({ at }: { at: Date | null }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  if (!at) return <span className="hidden text-ink-muted sm:inline">Progress saves as you go</span>;
  const secs = Math.round((Date.now() - at.getTime()) / 1000);
  return (
    <span role="status" className="inline-flex items-center gap-1.5 text-sage-ink">
      <Icon name="check" className="h-4 w-4" /> Saved {secs < 30 ? "just now" : `${Math.round(secs / 60)} min ago`}
    </span>
  );
}

/** Date of birth is set at sign-up; age is calculated on the server and only the age is shown. */
function DobNote({ profile }: { profile: OwnProfile }) {
  if (!profile.dateOfBirth) return null;
  const d = new Date(`${profile.dateOfBirth}T00:00:00Z`);
  return (
    <p className="mb-8 rounded-2xl bg-white/70 px-4 py-3 text-sm text-ink-soft">
      Date of birth: <strong className="text-ink">{d.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}</strong> · others only see your age ({profile.age}). Contact support if it's wrong.
    </p>
  );
}

function ValuesQuestions() {
  const { data, setData } = useResource<Question[]>("/compatibility/questions");
  const picks = (data ?? []).filter((q) => ["COMMUNICATION", "VALUES", "LIFESTYLE"].includes(q.dimension)).slice(0, 3);
  if (!picks.length) return null;
  return (
    <section className="mt-14" aria-labelledby="values-h">
      <h2 id="values-h" className="text-2xl">
        What you value <span className="font-sans text-base font-normal text-ink-muted">· optional</span>
      </h2>
      <p className="mt-1 text-ink-soft">A few quick questions that power compatibility. Skip any of them — your individual answers are never shown.</p>
      <div className="mt-6 space-y-4">
        {picks.map((q) => (
          <QuestionCard key={q.id} q={q} onSaved={(nq) => setData((l) => l!.map((x) => (x.id === nq.id ? nq : x)))} />
        ))}
      </div>
    </section>
  );
}

function PreviewStep({ profile, preview, onEdit }: { profile: OwnProfile; preview: ReturnType<typeof toPreview>; onEdit: (k: StepKey) => void }) {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [discoverable, setDiscoverable] = useState(profile.isDiscoverable);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tips = [
    profile.photos.length < 3 && { text: "Add a couple more photos", step: "photos" as StepKey },
    profile.prompts.length < 2 && { text: "Answer another prompt — they're great conversation starters", step: "words" as StepKey },
    profile.interests.length < 5 && { text: "Add a few more of the little things", step: "little" as StepKey },
  ].filter(Boolean) as { text: string; step: StepKey }[];

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      if (discoverable !== profile.isDiscoverable) await api.post("/settings/discovery", { isDiscoverable: discoverable });
      await api.post("/profiles/me/publish");
      await refresh();
      navigate("/app/discover", { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section>
      <h1 className="mt-3 text-4xl sm:text-5xl">This is your story.</h1>
      <p className="mt-3 max-w-2xl text-lg text-ink-soft">It's exactly what others will see. Nothing is public until you publish.</p>
      <div className="mt-10 grid gap-10 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 rounded-[2.5rem] border hairline bg-white/50 p-4 sm:p-8">
          <EditorialProfile profile={preview} preview />
        </div>
        <aside className="space-y-5 xl:sticky xl:top-36 xl:self-start">
          {tips.length > 0 && (
            <div className="rounded-3xl bg-white/80 p-5">
              <p className="text-sm font-semibold">Optional finishing touches</p>
              <ul className="mt-2 space-y-1">
                {tips.map((t) => (
                  <li key={t.text}>
                    <button type="button" onClick={() => onEdit(t.step)} className="text-left text-sm text-plum hover:underline">
                      {t.text}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="rounded-3xl bg-white/80 p-5">
            <p className="text-sm font-semibold">Edit</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {STEPS.slice(0, 5).map((s) => (
                <Button key={s.key} variant="secondary" size="sm" onClick={() => onEdit(s.key)}>
                  {s.short}
                </Button>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-3 rounded-3xl bg-white/80 p-5 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-plum" checked={discoverable} onChange={(e) => setDiscoverable(e.target.checked)} />
            <span>
              <span className="block font-semibold">Show me in Discover</span>
              <span className="text-ink-muted">Turn off to be seen only by people you like first.</span>
            </span>
          </label>
          {error && (
            <p role="alert" className="rounded-2xl bg-rose-soft px-4 py-3 text-sm text-rose-ink">
              {error}
            </p>
          )}
          <Button size="lg" className="w-full" onClick={publish} loading={publishing}>
            {profile.isPublished ? "Save & return to Knot" : "Publish my story"}
          </Button>
        </aside>
      </div>
    </section>
  );
}
