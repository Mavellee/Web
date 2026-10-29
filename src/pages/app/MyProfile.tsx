import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { AiPanel } from "../../components/app/AiPanel";
import { BasicsSection, IntentionSection, PreferencesSection } from "../../components/profile/ProfileSections";
import { PhotoManager } from "../../components/profile/PhotoManager";
import { ProfileCard } from "../../components/profile/ProfileCard";
import { CompletionMeter, completionItems } from "../../components/profile/Completion";
import type { Question } from "../../components/compat/QuestionCard";
import { ButtonLink } from "../../components/ui/Button";
import { Badge } from "../../components/ui/Badge";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { ErrorState } from "../../components/ui/States";
import { Tabs } from "../../components/ui/Tabs";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../lib/auth";
import { useResource } from "../../lib/useResource";
import type { OwnProfile, PublicProfile } from "../../lib/types";

type Tab = "details" | "photos" | "intentions" | "preferences";
const TABS: { value: Tab; label: string }[] = [
  { value: "details", label: "Details" },
  { value: "photos", label: "Photos" },
  { value: "intentions", label: "Intentions" },
  { value: "preferences", label: "Preferences" },
];

export function MyProfile() {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.some((t) => t.value === params.get("tab")) ? params.get("tab") : "details") as Tab;
  const { data, error, loading, reload, setData } = useResource<OwnProfile>("/profiles/me");
  const questions = useResource<Question[]>("/compatibility/questions");
  const interests = useResource<{ slug: string; name: string }[]>("/meta/interests");
  const { account, refresh } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const saved = (p: OwnProfile) => {
    setData(p);
    toast("Saved");
    void refresh();
  };

  const preview: PublicProfile | null = useMemo(
    () =>
      data && {
        id: account?.id ?? "me",
        displayName: data.displayName,
        age: data.age,
        gender: data.gender ?? "OTHER",
        city: data.city,
        distance: null,
        bio: data.bio,
        languages: data.languages,
        intentions: data.intentions,
        interests: data.interests.map((slug) => ({ slug, name: interests.data?.find((i) => i.slug === slug)?.name ?? slug, shared: false })),
        sharedInterestCount: 0,
        photoIds: data.photos.map((p) => p.id),
        isApprovedExpert: false,
      },
    [data, interests.data, account?.id],
  );

  const answered = questions.data ? questions.data.filter((q) => q.myAnswer).length : null;
  const items = data ? completionItems(data, answered) : [];
  const go = (t: string) => (t === "compatibility" ? navigate("/app/compatibility") : setParams({ tab: t }));

  return (
    <AppPage wide>
      <PageHeader
        title="Your profile"
        lede="Changes are visible to others as soon as you save."
        actions={
          account && (
            <ButtonLink to={`/app/people/${account.id}`} variant="secondary" size="sm">
              View as others see it
            </ButtonLink>
          )
        }
      />
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : data && preview ? (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] [&>*]:min-w-0">
          <aside className="space-y-5 lg:sticky lg:top-8 lg:self-start">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">Preview</p>
              {data.isPublished ? <Badge tone="sage">{data.discoveryPaused ? "Published · paused" : "Published"}</Badge> : <Badge tone="gold">Not published</Badge>}
            </div>
            <ProfileCard profile={preview} preview />
            <CompletionMeter items={items} onGo={go} />
          </aside>
          <section aria-label="Edit profile">
            <Tabs label="Profile sections" className="mb-8" tabs={TABS} value={tab} onChange={(t) => setParams({ tab: t })} />
            <div role="tabpanel" aria-label={TABS.find((t) => t.value === tab)?.label} className="animate-rise">
              {tab === "details" && (
                <>
                  <BasicsSection key={JSON.stringify(data.interests)} profile={data} onSaved={saved} />
                  <div className="mt-8">
                    <AiPanel title="Help with my bio" request={{ feature: "bio_help", draft: data.bio ?? "" }} />
                  </div>
                </>
              )}
              {tab === "photos" && <PhotoManager photos={data.photos} onChange={reload} />}
              {tab === "intentions" && <IntentionSection profile={data} onSaved={saved} />}
              {tab === "preferences" && <PreferencesSection profile={data} onSaved={saved} />}
            </div>
          </section>
        </div>
      ) : null}
    </AppPage>
  );
}
