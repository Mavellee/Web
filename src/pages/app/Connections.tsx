import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { SafetyMenu } from "../../components/app/SafetyActions";
import { AiPanel } from "../../components/app/AiPanel";
import { ProfileCard, IntentionBadges } from "../../components/profile/ProfileCard";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Dialog } from "../../components/ui/Dialog";
import { Photo } from "../../components/ui/Photo";
import { Skeleton, LoadingBlock } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { Icon } from "../../components/ui/Icon";
import { useToast } from "../../components/ui/Toast";
import { api, ApiError } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { CONFIDENCE_LABEL, DIMENSION_LABEL, genderLabel } from "../../lib/labels";
import { timeAgo, cx } from "../../lib/format";
import type { CompatResult, PublicProfile } from "../../lib/types";

type Page = { items: PublicProfile[]; nextCursor: string | null };
type LikeResult = { matched: boolean; matchId: string | null };

export function Discover() {
  const [queue, setQueue] = useState<PublicProfile[]>([]);
  const [cursor, setCursor] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [acting, setActing] = useState<"like" | "pass" | null>(null);
  const [matched, setMatched] = useState<{ profile: PublicProfile; matchId: string } | null>(null);
  const fetching = useRef(false);
  const toast = useToast();
  const navigate = useNavigate();

  const fetchMore = useCallback(async (from?: string | null) => {
    if (fetching.current || from === null) return;
    fetching.current = true;
    try {
      const page = await api.get<Page>(`/discovery?limit=10${from ? `&cursor=${from}` : ""}`);
      setQueue((q) => {
        const seen = new Set(q.map((p) => p.id));
        return [...q, ...page.items.filter((p) => !seen.has(p.id))];
      });
      setCursor(page.nextCursor);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", "Something went wrong."));
    } finally {
      fetching.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchMore(undefined);
  }, [fetchMore]);

  useEffect(() => {
    if (!loading && queue.length < 3 && cursor) void fetchMore(cursor);
  }, [queue.length, cursor, loading, fetchMore]);

  const current = queue[0];

  const act = async (kind: "like" | "pass") => {
    if (!current || acting) return;
    setActing(kind);
    try {
      if (kind === "like") {
        const r = await api.post<LikeResult>("/likes", { userId: current.id });
        if (r.matched && r.matchId) setMatched({ profile: current, matchId: r.matchId });
      } else {
        await api.post("/likes/pass", { userId: current.id });
      }
      setQueue((q) => q.slice(1));
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "That didn't go through. Try again.", "error");
    } finally {
      setActing(null);
    }
  };

  return (
    <AppPage>
      <PageHeader title="Discover" lede="People whose intentions and preferences fit with yours — in both directions." actions={<ButtonLink to="/app/profile?tab=preferences" variant="secondary" size="sm">Preferences</ButtonLink>} />
      {loading ? (
        <div className="mx-auto max-w-md" role="status" aria-label="Loading profiles">
          <Skeleton className="aspect-[4/5] w-full rounded-[2rem]" />
          <Skeleton className="mt-4 h-6 w-2/3" />
          <Skeleton className="mt-2 h-16 w-full" />
        </div>
      ) : error && !queue.length ? (
        error.status === 400 ? (
          <EmptyState title="Finish your profile first" action={<ButtonLink to="/onboarding">Continue setup</ButtonLink>}>
            {error.message}
          </EmptyState>
        ) : (
          <ErrorState message={error.message} onRetry={() => fetchMore(undefined)} />
        )
      ) : !current ? (
        <EmptyState
          title="You're all caught up"
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <ButtonLink to="/app/profile?tab=preferences">Adjust preferences</ButtonLink>
              <ButtonLink to="/app/games" variant="secondary">
                Play a game
              </ButtonLink>
            </div>
          }
        >
          You've seen everyone who fits your preferences right now. New people join every day — or widen your age range or distance.
        </EmptyState>
      ) : (
        <div className="mx-auto max-w-md">
          <div key={current.id} className="animate-rise">
            <ProfileCard
              profile={current}
              actions={
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <Button variant="secondary" size="lg" onClick={() => act("pass")} loading={acting === "pass"} disabled={!!acting} icon={<Icon name="close" />}>
                    Pass
                  </Button>
                  <Button size="lg" onClick={() => act("like")} loading={acting === "like"} disabled={!!acting} icon={<Icon name="heart" />}>
                    Like
                  </Button>
                </div>
              }
            />
          </div>
          <p className="mt-4 text-center text-xs text-ink-muted">Likes are private until they're mutual.</p>
        </div>
      )}
      <Dialog open={!!matched} onClose={() => setMatched(null)} title="It's mutual" description={matched ? `You and ${matched.profile.displayName} liked each other.` : undefined}>
        {matched && (
          <div>
            <div className="flex justify-center py-2">
              <Photo id={matched.profile.photoIds[0]} alt={matched.profile.displayName} className="h-32 w-32" rounded="rounded-full" />
            </div>
            <p className="mt-3 text-center text-ink-soft">There's no rush. Say hello when you're ready.</p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <Button variant="secondary" onClick={() => setMatched(null)}>
                Keep exploring
              </Button>
              <Button
                onClick={async () => {
                  const matches = await api.get<{ id: string; conversationId: string }[]>("/matches");
                  const m = matches.find((x) => x.id === matched.matchId);
                  setMatched(null);
                  navigate(m?.conversationId ? `/app/messages/${m.conversationId}` : "/app/matches");
                }}
              >
                Say hello
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </AppPage>
  );
}

type LikeEntry = { likedAt: string; profile: PublicProfile };

export function Likes() {
  const [tab, setTab] = useState<"received" | "sent">("received");
  const { data, error, loading, reload, setData } = useResource<LikeEntry[]>(`/likes/${tab}`);
  const toast = useToast();
  const navigate = useNavigate();

  const respond = async (p: PublicProfile, kind: "like" | "pass") => {
    try {
      if (kind === "like") {
        const r = await api.post<LikeResult>("/likes", { userId: p.id });
        if (r.matched) {
          toast(`You and ${p.displayName} matched`);
          navigate("/app/matches");
        }
      } else await api.post("/likes/pass", { userId: p.id });
      setData((d) => d?.filter((x) => x.profile.id !== p.id) ?? null);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Something went wrong.", "error");
    }
  };

  return (
    <AppPage wide>
      <PageHeader title="Likes" lede="Real likes from real people. Like someone back to match." />
      <div role="tablist" aria-label="Likes" className="mb-8 inline-flex rounded-full bg-ivory-deep p-1">
        {(["received", "sent"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cx("rounded-full px-5 py-2 text-sm font-semibold transition", tab === t ? "bg-white text-plum shadow-soft" : "text-ink-soft")}>
            {t === "received" ? "Liked you" : "You liked"}
          </button>
        ))}
      </div>
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState title={tab === "received" ? "No new likes yet" : "You haven't liked anyone yet"} action={<ButtonLink to="/app/discover">Go to Discover</ButtonLink>}>
          {tab === "received" ? "When someone likes you, they'll appear here. We'll never invent likes to keep you checking." : "People you like will show here until they like you back."}
        </EmptyState>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map(({ profile: p, likedAt }) => (
            <li key={p.id} className="overflow-hidden rounded-3xl border hairline bg-white shadow-soft">
              <Link to={`/app/people/${p.id}`} className="block">
                <Photo id={p.photoIds[0]} alt={p.displayName} className="aspect-[4/5] w-full" rounded="rounded-none" />
              </Link>
              <div className="p-5">
                <p className="font-serif text-2xl">
                  {p.displayName}
                  {p.age != null && `, ${p.age}`}
                </p>
                <p className="text-sm text-ink-muted">
                  {p.city} · {tab === "received" ? "liked you" : "you liked"} {timeAgo(likedAt)}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <IntentionBadges intentions={p.intentions} />
                </div>
                {tab === "received" && (
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="sm" onClick={() => respond(p, "pass")}>
                      Pass
                    </Button>
                    <Button size="sm" onClick={() => respond(p, "like")}>
                      Like back
                    </Button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}

type MatchEntry = { id: string; createdAt: string; conversationId: string | null; lastMessageAt: string | null; profile: PublicProfile };

export function Matches() {
  const { data, error, loading, reload } = useResource<MatchEntry[]>("/matches");
  return (
    <AppPage wide>
      <PageHeader title="Matches" lede="People you've both said yes to." />
      {loading ? (
        <LoadingBlock label="Loading matches" />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState title="No matches yet" action={<ButtonLink to="/app/discover">Discover people</ButtonLink>}>
          When you and someone else both like each other, you'll find them here.
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.map((m) => (
            <li key={m.id} className="flex items-center gap-4 rounded-3xl border hairline bg-white/80 p-4 shadow-soft">
              <Link to={`/app/people/${m.profile.id}`}>
                <Photo id={m.profile.photoIds[0]} alt={m.profile.displayName} className="h-20 w-20" rounded="rounded-2xl" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-xl">
                  {m.profile.displayName}
                  {m.profile.age != null && `, ${m.profile.age}`}
                </p>
                <p className="text-sm text-ink-muted">Matched {timeAgo(m.createdAt)}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <IntentionBadges intentions={m.profile.intentions} />
                </div>
              </div>
              {m.conversationId && (
                <ButtonLink to={`/app/messages/${m.conversationId}`} size="sm" aria-label={`Message ${m.profile.displayName}`}>
                  <Icon name="chat" className="h-4 w-4" />
                  <span className="hidden sm:inline">Message</span>
                </ButtonLink>
              )}
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  aligned: { label: "Aligned", cls: "bg-sage text-sage-ink" },
  partly_aligned: { label: "Partly aligned", cls: "bg-gold-soft text-gold-ink" },
  different: { label: "Different", cls: "bg-rose-soft text-rose-ink" },
  missing_you: { label: "You haven't answered", cls: "bg-ink/5 text-ink-soft" },
  missing_them: { label: "They haven't answered", cls: "bg-ink/5 text-ink-soft" },
  missing_both: { label: "Neither answered", cls: "bg-ink/5 text-ink-soft" },
};

export function CompatibilityBreakdown({ result, otherName }: { result: CompatResult; otherName: string }) {
  return (
    <section aria-labelledby="compat-title" className="rounded-4xl border hairline bg-white/80 p-6 shadow-soft sm:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Compatibility</p>
          <h2 id="compat-title" className="mt-2 text-3xl">
            {result.score === null ? "Not enough to compare yet" : `${result.score} / 100 overlap`}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">{CONFIDENCE_LABEL[result.confidence]}. This reflects stated preferences only — it doesn't predict how things will go.</p>
        </div>
        {result.dealbreakerConflicts > 0 && <p className="rounded-full bg-rose-soft px-3 py-1.5 text-sm font-semibold text-rose-ink">{result.dealbreakerConflicts} dealbreaker conflict{result.dealbreakerConflicts > 1 ? "s" : ""}</p>}
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {result.dimensions.map((d) => (
          <li key={d.dimension} className="rounded-2xl bg-ivory-deep/60 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">{DIMENSION_LABEL[d.dimension]}</span>
              <span className="text-ink-muted">{d.score === null ? "No data" : `${d.score}%`}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white" role="presentation">
              <div className="h-full rounded-full bg-plum transition-all duration-700" style={{ width: `${d.score ?? 0}%` }} />
            </div>
            {d.missing > 0 && <p className="mt-1.5 text-xs text-ink-muted">{d.missing} answered by only one of you</p>}
          </li>
        ))}
      </ul>
      <details className="group mt-6">
        <summary className="cursor-pointer list-none text-sm font-semibold text-plum">
          <span className="group-open:hidden">See what contributed</span>
          <span className="hidden group-open:inline">Hide details</span>
        </summary>
        <ul className="mt-4 divide-y hairline">
          {result.items.map((i) => (
            <li key={i.key} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm">{i.label}</span>
              <span className="flex gap-1.5">
                {i.dealbreaker && <span className="rounded-full bg-rose px-2.5 py-0.5 text-xs font-semibold text-rose-ink">{i.dealbreaker === "yours" ? "Your dealbreaker" : `${otherName}'s dealbreaker`}</span>}
                <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[i.status].cls)}>{STATUS_STYLE[i.status].label}</span>
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-muted">Individual answers stay private — we only show whether they line up. Engine version {result.version}.</p>
      </details>
    </section>
  );
}

export function PersonProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { data, error, loading, reload } = useResource<PublicProfile & { compatibility: CompatResult | null }>(`/profiles/${id}`);
  const matches = useResource<MatchEntry[]>("/matches");
  const match = matches.data?.find((m) => m.profile.id === id);
  const [busy, setBusy] = useState(false);

  if (loading) return <AppPage><LoadingBlock label="Loading profile" /></AppPage>;
  if (error || !data)
    return (
      <AppPage>
        <EmptyState title="This profile isn't available" action={<ButtonLink to="/app/discover">Back to Discover</ButtonLink>}>
          They may have paused their profile, or it may no longer be on Knot.
        </EmptyState>
        {error && error.status !== 404 && <ErrorState message={error.message} onRetry={reload} />}
      </AppPage>
    );

  const like = async () => {
    setBusy(true);
    try {
      const r = await api.post<LikeResult>("/likes", { userId: data.id });
      toast(r.matched ? `You and ${data.displayName} matched` : `You liked ${data.displayName}`);
      void matches.reload();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Something went wrong.", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppPage wide>
      <button type="button" onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <Icon name="back" className="h-4 w-4" /> Back
      </button>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <div className="space-y-4">
          {data.photoIds.length ? data.photoIds.map((pid, i) => <Photo key={pid} id={pid} alt={`Photo ${i + 1} of ${data.displayName}`} className="aspect-[4/5] w-full" />) : <Photo alt={data.displayName} className="aspect-[4/5] w-full" />}
        </div>
        <div className="space-y-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-5xl">
                {data.displayName}
                {data.age != null && <span className="font-normal">, {data.age}</span>}
              </h1>
              <p className="mt-2 text-ink-soft">{[genderLabel(data.gender), data.city, data.distance].filter(Boolean).join(" · ")}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <IntentionBadges intentions={data.intentions} />
              </div>
            </div>
            <SafetyMenu userId={data.id} name={data.displayName} matchId={match?.id} onEnded={() => navigate("/app/discover")} />
          </div>
          {data.bio && <p className="font-serif text-xl leading-relaxed text-ink">{data.bio}</p>}
          <dl className="grid gap-6 sm:grid-cols-2">
            {data.interests.length > 0 && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Interests</dt>
                <dd className="mt-2 flex flex-wrap gap-1.5">
                  {data.interests.map((i) => (
                    <span key={i.slug} className={cx("rounded-full px-3 py-1 text-sm", i.shared ? "bg-plum-50 font-semibold text-plum-700" : "bg-ivory-deep text-ink-soft")}>
                      {i.name}
                    </span>
                  ))}
                </dd>
              </div>
            )}
            {data.languages.length > 0 && (
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Languages</dt>
                <dd className="mt-2 text-ink-soft">{data.languages.join(", ")}</dd>
              </div>
            )}
          </dl>
          {data.compatibility && <CompatibilityBreakdown result={data.compatibility} otherName={data.displayName} />}
          <AiPanel title="Explain this in plain words" request={{ feature: "explain_compatibility", userId: data.id }} />
          <div className="flex flex-wrap gap-3">
            {match?.conversationId ? (
              <ButtonLink to={`/app/messages/${match.conversationId}`} size="lg">
                Message {data.displayName}
              </ButtonLink>
            ) : (
              <Button size="lg" onClick={like} loading={busy} icon={<Icon name="heart" />}>
                Like
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppPage>
  );
}
