import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import { Drawer } from "../../components/ui/Drawer";
import { Icon } from "../../components/ui/Icon";
import { LogoLockup } from "../../components/ui/Logo";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { IntentionSection, PreferencesSection } from "../../components/profile/ProfileSections";
import type { Question } from "../../components/compat/QuestionCard";
import { IntroStep, type IntroDraft, type IntroHandle } from "../../components/story/IntroStep";
import { LifestyleStep } from "../../components/story/LifestyleStep";
import { MediaWorkspace } from "../../components/story/MediaWorkspace";
import { PromptWriter } from "../../components/story/PromptWriter";
import { InterestPicker } from "../../components/story/InterestPicker";
import { EditorialProfile } from "../../components/story/EditorialProfile";
import { StoryCompletion } from "../../components/story/StoryCompletion";
import { StoryPreviewCard, toPreview } from "../../components/story/StoryPreview";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import type { SaveStatus } from "../../lib/useAutosave";
import { useResource } from "../../lib/useResource";
import { cx } from "../../lib/format";
import type { OwnProfile } from "../../lib/types";

const STEPS = [
  { key: "intro", title: "The Introduction", heading: "Let's start with hello.", lede: "A few easy questions. You can change any of this later." },
  { key: "photos", title: "Your Photos & Videos", heading: "Show your world.", lede: "Add photos, and a short video if you like. Put them in your order, choose your main photo, and caption any of them." },
  { key: "words", title: "Your Personality", heading: "The little things that make you, you.", lede: "Pick a prompt that sounds like you and answer in your own words. It's often what people respond to first." },
  { key: "little", title: "Your Interests", heading: "What do you love?", lede: "Music, food, weekends, the topics you could go on about. Anything you share with someone gets highlighted for you both." },
  { key: "connection", title: "Your Kind of Connection", heading: "What are you open to right now?", lede: "There's no right answer. It's a preference, never a label, and you can change it whenever you like." },
  { key: "lifestyle", title: "Your Lifestyle", heading: "How you like to live.", lede: "Completely optional. Answer what feels useful and leave the rest." },
  { key: "preview", title: "The Final Preview", heading: "Your story is coming together.", lede: "This is exactly what people see in Discover. Nothing is public until you publish." },
] as const;
type StepKey = (typeof STEPS)[number]["key"];

const stepStore = (id: string) => `knot:story-step:${id}`;
const readStep = (id: string): StepKey | null => {
  try {
    const k = localStorage.getItem(stepStore(id));
    return STEPS.some((s) => s.key === k) ? (k as StepKey) : null;
  } catch {
    return null;
  }
};
const writeStep = (id: string, k: StepKey | null) => {
  try {
    if (k) localStorage.setItem(stepStore(id), k);
    else localStorage.removeItem(stepStore(id));
  } catch {
    /* private mode: resume falls back to the first unfinished step */
  }
};

/** The server creates a profile only once these exist; every other step saves onto that profile. */
const hasProfile = (p: OwnProfile) => !!p.displayName && !!p.gender && p.interestedIn.length > 0;

/** With nothing remembered on this device, resume where the saved data ends. */
function firstIncomplete(p: OwnProfile): StepKey {
  if (!hasProfile(p)) return "intro";
  if (!p.media.length) return "photos";
  if (!p.prompts.length) return "words";
  if (!p.interests.length) return "little";
  if (!p.intentions.length) return "connection";
  return "preview";
}

export function Onboarding() {
  const { data, error, loading, reload, setData } = useResource<OwnProfile>("/profiles/me");
  const interests = useResource<{ slug: string; name: string }[]>("/meta/interests");
  const questions = useResource<Question[]>("/compatibility/questions");
  const { account } = useAuth();
  const [step, setStep] = useState<StepKey | null>(null);
  const [status, setStatus] = useState<{ s: SaveStatus; retry?: () => void }>({ s: "idle" });
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [draft, setDraft] = useState<IntroDraft>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [continuing, setContinuing] = useState(false);
  const intro = useRef<IntroHandle>(null);
  const userId = account?.id ?? "me";

  useEffect(() => {
    if (!data || step) return;
    const remembered = readStep(userId);
    setStep(hasProfile(data) ? (remembered ?? firstIncomplete(data)) : "intro");
  }, [data, step, userId]);

  const report = (s: SaveStatus, retry?: () => void) => {
    setStatus({ s, retry });
    if (s === "saved") setSavedAt(new Date());
  };
  const index = step ? STEPS.findIndex((s) => s.key === step) : 0;
  const unlocked = !!data && hasProfile(data);
  const answered = questions.data?.filter((q) => q.myAnswer && ["LIFESTYLE", "COMMUNICATION", "VALUES"].includes(q.dimension)).length ?? 0;
  const done: Record<StepKey, boolean> = {
    intro: unlocked,
    photos: !!data?.media.length,
    words: !!data?.prompts.length,
    little: !!data?.interests.length,
    connection: !!data?.intentions.length,
    lifestyle: answered > 0,
    preview: !!data?.isPublished,
  };
  const complete = Object.values(done).filter(Boolean).length;

  const go = (k: StepKey) => {
    setStep(k);
    writeStep(userId, k);
    window.scrollTo?.({ top: 0, behavior: "smooth" });
  };
  const saved = (p: OwnProfile) => {
    setData(p);
    report("saved");
  };
  const next = STEPS[index + 1]?.key;
  const onContinue = async () => {
    if (step === "intro") {
      setContinuing(true);
      const ok = await intro.current?.submit();
      setContinuing(false);
      if (!ok) return;
    }
    if (next) go(next);
  };
  const preview = useMemo(() => (data ? toPreview(step === "intro" ? { ...data, ...draft } : data, userId, interests.data ?? []) : null), [data, draft, step, userId, interests.data]);
  const current = STEPS[index];
  const pendingMedia = data?.media.filter((m) => m.status === "PENDING").length ?? 0;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b hairline bg-parchment/90 backdrop-blur">
        <div className="container-page flex items-center justify-between gap-3 py-3">
          <LogoLockup size="sm" />
          <div className="flex items-center gap-3 text-sm">
            <SaveIndicator status={status} at={savedAt} />
            {step !== "preview" && preview && (
              <Button variant="secondary" size="sm" className="lg:hidden" onClick={() => setPreviewOpen(true)} icon={<Icon name="eye" className="h-4 w-4" />}>
                Preview
              </Button>
            )}
          </div>
        </div>
        <nav aria-label="Your story progress" className="container-page pb-2.5">
          <ol className="grid grid-cols-7 gap-1">
            {STEPS.map((s, i) => (
              <li key={s.key}>
                <button type="button" disabled={!unlocked} onClick={() => go(s.key)} aria-current={s.key === step ? "step" : undefined} aria-label={`Step ${i + 1}: ${s.title}${done[s.key] ? " (complete)" : ""}`} className="block w-full py-1.5 text-left disabled:cursor-default">
                  <span className={cx("block h-1.5 rounded-full transition-colors duration-500", s.key === step ? "bg-primary" : done[s.key] ? "bg-primary-200" : "bg-line")} />
                  <span className={cx("mt-1.5 hidden truncate text-[11px] xl:block", s.key === step ? "font-semibold text-primary" : "text-ink-muted")}>{s.title}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-1 text-xs tabular-nums text-ink-muted">
            Step {index + 1} of {STEPS.length} · {complete} complete · {STEPS.length - complete} to go
          </p>
        </nav>
      </header>

      <div className={cx("container-page grid flex-1 gap-10 py-8 lg:py-10", step !== "preview" && "lg:grid-cols-[minmax(0,1fr)_22rem]")}>
        <main id="main" className="min-w-0">
          {loading && !data && <LoadingBlock label="Loading your story" />}
          {error && <ErrorState message={error.message} onRetry={reload} />}
          {data && step && preview && (
            <div key={step} className="animate-rise">
              <p className="eyebrow">{current.title}</p>
              <h1 className="mt-3 text-4xl sm:text-5xl">{current.heading}</h1>
              <p className="mt-3 max-w-2xl text-lg text-ink-soft">{current.lede}</p>
              <div className="mt-10">
                {step === "intro" && <IntroStep ref={intro} profile={data} userId={userId} onSaved={setData} onDraft={setDraft} onStatus={report} />}
                {step === "photos" && (
                  <div className="space-y-10">
                    <MediaWorkspace
                      media={data.media}
                      limits={data.mediaLimits}
                      onChange={() => {
                        void reload();
                        setSavedAt(new Date());
                        setStatus({ s: "saved" });
                      }}
                    />
                    {data.media.length > 0 && (
                      <section aria-labelledby="in-discover">
                        <h2 id="in-discover" className="text-2xl">
                          How this looks in Discover
                        </h2>
                        <p className="mt-1 text-sm text-ink-muted">Your gallery, in this order, with your captions.{pendingMedia > 0 && ` ${pendingMedia} ${pendingMedia === 1 ? "item is" : "items are"} still being checked and will appear once approved.`}</p>
                        <div className="mt-4 max-w-lg rounded-[2rem] border hairline bg-surface/50 p-3 sm:p-5">
                          <EditorialProfile profile={preview} preview />
                        </div>
                      </section>
                    )}
                  </div>
                )}
                {step === "words" && <PromptWriter autosave answers={data.prompts} onSaved={setData} onStatus={report} />}
                {step === "little" && <InterestPicker autosave selected={data.interests} onSaved={setData} onStatus={report} />}
                {step === "connection" && (
                  <div className="max-w-2xl space-y-8">
                    <IntentionSection autosave profile={data} onSaved={setData} onStatus={report} />
                    <details className="rounded-3xl border hairline bg-surface/70 p-5">
                      <summary className="cursor-pointer font-serif text-xl">Who you'd like to see</summary>
                      <div className="mt-5">
                        <PreferencesSection profile={data} submitLabel="Save preferences" onSaved={saved} />
                      </div>
                    </details>
                  </div>
                )}
                {step === "lifestyle" && <LifestyleStep questions={questions.data} loading={questions.loading} onChange={(q) => (questions.setData((l) => l!.map((x) => (x.id === q.id ? q : x))), report("saved"))} />}
                {step === "preview" && <PreviewStep profile={data} preview={preview} onEdit={go} onPublished={() => writeStep(userId, null)} />}
              </div>
            </div>
          )}
        </main>
        {step !== "preview" && preview && (
          <aside className="hidden lg:block" aria-label="Live preview">
            <div className="sticky top-36 max-h-[calc(100dvh-10rem)] space-y-5 overflow-y-auto pb-4">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Live preview</p>
                <StoryPreviewCard profile={preview} />
              </div>
              {data && <StoryCompletion profile={data} onGo={go} />}
            </div>
          </aside>
        )}
      </div>

      {data && step && (
        <div className="sticky bottom-0 z-10 border-t hairline bg-parchment/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="container-page flex items-center justify-between gap-2 py-3">
            {index > 0 ? (
              <Button variant="quiet" onClick={() => go(STEPS[index - 1].key)}>
                Back
              </Button>
            ) : (
              <span />
            )}
            {next && (
              <div className="flex items-center gap-1 sm:gap-2">
                {(step !== "intro" || unlocked) && (
                  <Button variant="quiet" onClick={() => go(next)}>
                    Skip for now
                  </Button>
                )}
                <Button onClick={onContinue} loading={continuing}>
                  Continue
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      <Drawer open={previewOpen} onClose={() => setPreviewOpen(false)} title="Your profile so far">
        <div className="space-y-6 p-5">
          {preview && <EditorialProfile profile={preview} preview />}
          {data && (
            <StoryCompletion
              profile={data}
              onGo={(k) => {
                setPreviewOpen(false);
                if (unlocked) go(k);
              }}
            />
          )}
        </div>
      </Drawer>
    </div>
  );
}

function SaveIndicator({ status, at }: { status: { s: SaveStatus; retry?: () => void }; at: Date | null }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const quiet = "hidden text-ink-muted sm:inline";
  if (status.s === "saving")
    return (
      <span role="status" className="text-ink-muted">
        Saving…
      </span>
    );
  if (status.s === "dirty")
    return (
      <span role="status" className="text-ink-muted">
        Unsaved changes
      </span>
    );
  if (status.s === "local")
    return (
      <span role="status" className="text-ink-muted">
        Saved on this device
      </span>
    );
  if (status.s === "error")
    return (
      <span role="alert" className="inline-flex items-center gap-2 text-error">
        Not saved
        {status.retry && (
          <button type="button" onClick={status.retry} className="font-semibold underline">
            Retry
          </button>
        )}
      </span>
    );
  if (!at) return <span className={quiet}>Progress saves as you go</span>;
  const secs = Math.round((Date.now() - at.getTime()) / 1000);
  return (
    <span role="status" className="inline-flex items-center gap-1.5 text-success">
      <Icon name="check" className="h-4 w-4" /> Saved{secs >= 30 && ` ${Math.max(1, Math.round(secs / 60))} min ago`}
    </span>
  );
}

function PreviewStep({ profile, preview, onEdit, onPublished }: { profile: OwnProfile; preview: ReturnType<typeof toPreview>; onEdit: (k: StepKey) => void; onPublished: () => void }) {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [discoverable, setDiscoverable] = useState(profile.isDiscoverable);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const blockers = [!profile.displayName && "your name", !profile.photos.length && "a photo", !profile.intentions.length && "the kind of connection you're open to"].filter(Boolean);

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
      if (discoverable !== profile.isDiscoverable) await api.post("/settings/discovery", { isDiscoverable: discoverable });
      await api.post("/profiles/me/publish");
      await refresh();
      onPublished();
      navigate("/app/discover", { replace: true });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't publish. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="min-w-0 rounded-[2.5rem] border hairline bg-surface/50 p-4 sm:p-8">
          <EditorialProfile profile={preview} preview />
        </div>
        <aside className="space-y-5 xl:sticky xl:top-36 xl:self-start">
          <StoryCompletion profile={profile} onGo={onEdit} />
          <div className="rounded-3xl bg-surface/80 p-5">
            <p className="text-sm font-semibold">Edit a section</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {STEPS.slice(0, 6).map((s) => (
                <Button key={s.key} variant="secondary" size="sm" onClick={() => onEdit(s.key)}>
                  {s.title.replace(/^(The|Your) /, "")}
                </Button>
              ))}
            </div>
            <p className="mt-3 text-xs text-ink-muted">Your lifestyle answers stay private and aren't part of this preview.</p>
          </div>
          <label className="flex items-start gap-3 rounded-3xl bg-surface/80 p-5 text-sm">
            <input type="checkbox" className="mt-0.5 h-5 w-5 accent-primary" checked={discoverable} onChange={(e) => setDiscoverable(e.target.checked)} />
            <span>
              <span className="block font-semibold">Show me in Discover</span>
              <span className="text-ink-muted">Turn off to be seen only by people you like first.</span>
            </span>
          </label>
          {error && (
            <p role="alert" className="rounded-2xl bg-error-soft px-4 py-3 text-sm text-error">
              {error}
            </p>
          )}
          {!profile.isPublished && <p className="font-serif text-xl leading-snug">Ready for someone to discover your kind of connection?</p>}
          {blockers.length > 0 && <p className="text-sm text-ink-soft">Before you publish, add {blockers.join(" and ")}.</p>}
          <Button size="lg" className="w-full" onClick={publish} loading={publishing} disabled={blockers.length > 0}>
            {profile.isPublished ? "Save & return to Mavelle" : "Publish My Profile"}
          </Button>
          <p className="text-xs text-ink-muted">Only photos and videos that have passed review are shown to others.</p>
        </aside>
      </div>
    </div>
  );
}
