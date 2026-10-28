import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../../components/ui/Logo";
import { Button } from "../../components/ui/Button";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { BasicsSection, IntentionSection, PreferencesSection } from "../../components/profile/ProfileSections";
import { PhotoManager } from "../../components/profile/PhotoManager";
import { ProfileCard } from "../../components/profile/ProfileCard";
import { QuestionCard, type Question } from "../../components/compat/QuestionCard";
import { api, ApiError } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { useResource } from "../../lib/useResource";
import type { OwnProfile, PublicProfile } from "../../lib/types";
import { cx } from "../../lib/format";

const STEPS = ["Account", "Your profile", "Intentions", "Preferences", "Preview"] as const;
type Stage = "basics" | "photos" | "intention" | "preferences" | "questions" | "preview";
const STAGE_STEP: Record<Stage, number> = { basics: 1, photos: 1, intention: 2, preferences: 3, questions: 3, preview: 4 };

function firstIncomplete(p: OwnProfile): Stage {
  if (!p.displayName || !p.gender || !p.city) return "basics";
  if (!p.photos.length) return "photos";
  if (!p.intentions.length) return "intention";
  return "preferences";
}

export function Onboarding() {
  const { data, error, loading, reload, setData } = useResource<OwnProfile>("/profiles/me");
  const [stage, setStage] = useState<Stage | null>(null);

  useEffect(() => {
    if (data && !stage) setStage(firstIncomplete(data));
  }, [data, stage]);

  const step = stage ? STAGE_STEP[stage] : 1;
  const back = (s: Stage) => (
    <Button variant="quiet" onClick={() => setStage(s)}>
      Back
    </Button>
  );

  return (
    <div className="min-h-dvh">
      <header className="container-page flex items-center justify-between py-6">
        <Logo />
        <p className="text-sm text-ink-muted">
          Step {step + 1} of {STEPS.length}
        </p>
      </header>
      <div className="container-page max-w-3xl">
        <ol className="mb-10 grid grid-cols-5 gap-2" aria-label="Onboarding progress">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined}>
              <div className={cx("h-1.5 rounded-full transition-colors duration-500", i <= step ? "bg-plum" : "bg-[#EADFD4]")} />
              <p className={cx("mt-2 hidden text-xs font-semibold sm:block", i === step ? "text-plum" : "text-ink-muted")}>{s}</p>
            </li>
          ))}
        </ol>
        <main id="main" className="pb-20">
          {loading && !data && <LoadingBlock label="Loading your profile" />}
          {error && <ErrorState message={error.message} onRetry={reload} />}
          {data && stage && (
            <div key={stage} className="animate-rise">
              {stage === "basics" && (
                <Section title="Tell people a little about you" lede="Only what you add here is shown. You can edit everything later.">
                  <BasicsSection profile={data} submitLabel="Continue" onSaved={(p) => (setData(p), setStage("photos"))} />
                </Section>
              )}
              {stage === "photos" && (
                <Section title="Add a few photos" lede="Clear, recent photos of you work best. Your first photo is the one people see first.">
                  <PhotoManager photos={data.photos} onChange={reload} />
                  <Nav back={back("basics")} next={<Button size="lg" disabled={!data.photos.length} onClick={() => setStage("intention")}>Continue</Button>} hint={!data.photos.length ? "Add at least one photo to continue." : undefined} />
                </Section>
              )}
              {stage === "intention" && (
                <Section title="What are you open to right now?" lede="Your intention helps the right people find you. It's a preference, not a label.">
                  <IntentionSection profile={data} submitLabel="Continue" secondary={back("photos")} onSaved={(p) => (setData(p), setStage("preferences"))} />
                </Section>
              )}
              {stage === "preferences" && (
                <Section title="Who would you like to meet?" lede="We apply these both ways, so you'll only see people who'd also like to see you.">
                  <PreferencesSection profile={data} submitLabel="Continue" secondary={back("intention")} onSaved={(p) => (setData(p), setStage("questions"))} />
                </Section>
              )}
              {stage === "questions" && <OptionalQuestions onBack={() => setStage("preferences")} onDone={() => setStage("preview")} />}
              {stage === "preview" && <Preview profile={data} onEdit={setStage} />}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function Section({ title, lede, children }: { title: string; lede?: string; children: React.ReactNode }) {
  return (
    <section>
      <h1 className="text-4xl sm:text-5xl">{title}</h1>
      {lede && <p className="mt-3 max-w-xl text-lg text-ink-soft">{lede}</p>}
      <div className="mt-10">{children}</div>
    </section>
  );
}

function Nav({ back, next, hint }: { back: React.ReactNode; next: React.ReactNode; hint?: string }) {
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

function OptionalQuestions({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { data, error, reload } = useResource<Question[]>("/compatibility/questions");
  const [list, setList] = useState<Question[] | null>(null);
  useEffect(() => {
    if (data) setList(data.slice(0, 4));
  }, [data]);
  return (
    <Section title="A few optional questions" lede="Answer any you like — or none. Skipped questions are never counted against you, and your individual answers are never shown to anyone.">
      {error && <ErrorState message={error.message} onRetry={reload} />}
      <div className="space-y-4">
        {list?.map((q) => (
          <QuestionCard key={q.id} q={q} onSaved={(nq) => setList((l) => l!.map((x) => (x.id === nq.id ? nq : x)))} />
        ))}
      </div>
      <p className="mt-4 text-sm text-ink-muted">You'll find more questions under Compatibility later.</p>
      <Nav back={<Button variant="quiet" onClick={onBack}>Back</Button>} next={<Button size="lg" onClick={onDone}>Continue to preview</Button>} />
    </Section>
  );
}

function Preview({ profile, onEdit }: { profile: OwnProfile; onEdit: (s: Stage) => void }) {
  const { account, refresh } = useAuth();
  const navigate = useNavigate();
  const interests = useResource<{ slug: string; name: string }[]>("/meta/interests");
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const asPublic: PublicProfile = {
    id: account?.id ?? "me",
    displayName: profile.displayName,
    age: profile.age,
    gender: profile.gender ?? "OTHER",
    city: profile.city,
    distance: null,
    bio: profile.bio,
    languages: profile.languages,
    intentions: profile.intentions,
    interests: profile.interests.map((slug) => ({ slug, name: interests.data?.find((i) => i.slug === slug)?.name ?? slug, shared: false })),
    sharedInterestCount: 0,
    photoIds: profile.photos.map((p) => p.id),
    isApprovedExpert: false,
  };

  const publish = async () => {
    setPublishing(true);
    setError(null);
    try {
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
    <Section title="This is how others will see you" lede="Take a look. Edit anything before you publish — or after.">
      <div className="grid gap-10 md:grid-cols-[minmax(0,22rem)_1fr]">
        <ProfileCard profile={asPublic} preview />
        <div className="space-y-6">
          <div className="rounded-3xl bg-sage/60 p-6">
            <h2 className="font-sans text-base font-semibold">Visible to people you may match with</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {["Display name and age", "Photos and bio", "City and a distance range", "Intentions, interests and languages"].map((t) => (
                <li key={t}>✓ {t}</li>
              ))}
            </ul>
            <h2 className="mt-5 font-sans text-base font-semibold">Always private</h2>
            <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
              {["Email address and date of birth", "Exact location", "Your individual compatibility answers"].map((t) => (
                <li key={t}>✕ {t}</li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => onEdit("basics")}>
              Edit details
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onEdit("photos")}>
              Edit photos
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onEdit("intention")}>
              Edit intentions
            </Button>
            <Button variant="secondary" size="sm" onClick={() => onEdit("preferences")}>
              Edit preferences
            </Button>
          </div>
          {error && (
            <p role="alert" className="rounded-2xl bg-rose-soft px-4 py-3 text-sm text-rose-ink">
              {error}
            </p>
          )}
          <Button size="lg" className="w-full sm:w-auto" onClick={publish} loading={publishing}>
            Publish my profile
          </Button>
        </div>
      </div>
    </Section>
  );
}
