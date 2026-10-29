import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { useConnectionActions } from "../../components/app/MatchDialog";
import { EditorialProfile, type EditorialData } from "../../components/story/EditorialProfile";
import { DetailComposer, type DetailTarget } from "../../components/story/DetailComposer";
import { MediaThumb } from "../../components/media/MediaThumb";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Drawer } from "../../components/ui/Drawer";
import { Icon } from "../../components/ui/Icon";
import { Skeleton, LoadingBlock } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { api, ApiError, photoUrl } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { intentionLabel } from "../../lib/labels";
import { mediaOf, primaryOf } from "../../lib/profile";
import { cx } from "../../lib/format";
import type { OwnProfile, PublicProfile } from "../../lib/types";
import { activeFilterCount, DiscoverFilters, filtersFromParams, filtersToQuery, type Filters } from "./discover/DiscoverFilters";

type Page = { items: PublicProfile[]; nextCursor: string | null };

/**
 * Discover, one person at a time: their whole profile — every photo and video, their words, their world and
 * how you connect — with Pass, Start with a detail, View compatibility and Like always within reach.
 * Profiles come from the cursor-paged discovery API; only the next person's profile data and main photo are
 * fetched ahead, never anyone's full gallery.
 */
export function Discover() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const query = filtersToQuery(filters).toString();
  const me = useResource<OwnProfile>("/profiles/me");
  const interests = useResource<{ slug: string; name: string }[]>("/meta/interests");
  const interestNames = useMemo(() => new Map((interests.data ?? []).map((i) => [i.slug, i.name])), [interests.data]);

  const [queue, setQueue] = useState<PublicProfile[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [picker, setPicker] = useState(false);
  const [detail, setDetail] = useState<{ profile: PublicProfile; target: DetailTarget } | null>(null);
  const [compatOpen, setCompatOpen] = useState(false);
  const [full, setFull] = useState<Record<string, EditorialData | ApiError>>({});
  const acted = useRef(new Set<string>());
  const fetchingMore = useRef(false);
  const seq = useRef(0);
  const top = useRef<HTMLDivElement>(null);

  const fetchPage = useCallback(
    async (from: string | null) => {
      const n = ++seq.current;
      const q = new URLSearchParams(query);
      q.set("limit", "8");
      if (from) q.set("cursor", from);
      const page = await api.get<Page>(`/discovery?${q}`);
      return n === seq.current ? page : null;
    },
    [query],
  );

  // Start over whenever the filters change.
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPage(null)
      .then((page) => {
        if (!page) return;
        setQueue(page.items.filter((p) => !acted.current.has(p.id)));
        setCursor(page.nextCursor);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", "Something went wrong."));
        setLoading(false);
      });
  }, [fetchPage]);

  // Keep a couple of people queued; never re-add anyone already shown or acted on.
  useEffect(() => {
    if (loading || !cursor || queue.length > 2 || fetchingMore.current) return;
    fetchingMore.current = true;
    fetchPage(cursor)
      .then((page) => {
        if (!page) return;
        setQueue((q) => [...q, ...page.items.filter((p) => !acted.current.has(p.id) && !q.some((x) => x.id === p.id))]);
        setCursor(page.nextCursor);
      })
      .catch(() => {})
      .finally(() => (fetchingMore.current = false));
  }, [queue.length, cursor, loading, fetchPage]);

  const current = queue[0] ?? null;
  const next = queue[1] ?? null;

  // The complete profile (with the full compatibility breakdown) for the current person, and the next one ahead.
  const load = useCallback(async (id: string) => {
    try {
      const data = await api.get<EditorialData>(`/profiles/${id}`);
      setFull((f) => ({ ...f, [id]: data }));
    } catch (e) {
      setFull((f) => ({ ...f, [id]: e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", "Couldn't load this profile.") }));
    }
  }, []);
  useEffect(() => {
    if (current && !full[current.id]) void load(current.id);
  }, [current, full, load]);
  useEffect(() => {
    if (!next || full[next.id]) return;
    void load(next.id);
    const lead = primaryOf(mediaOf(next));
    if (lead) new Image().src = photoUrl(lead.id); // only their main photo, so it appears instantly
  }, [next, full, load]);

  const advance = useCallback((id: string) => {
    acted.current.add(id);
    setDetail(null);
    setPicker(false);
    setCompatOpen(false);
    setQueue((q) => q.filter((p) => p.id !== id));
    top.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  }, []);
  const { act, busy, dialog } = useConnectionActions(advance);

  const applyFilters = (f: Filters) => {
    setParams(filtersToQuery(f), { replace: true });
    setFiltersOpen(false);
  };
  const count = activeFilterCount(filters);
  const filtersButton = (
    <Button variant="secondary" size="sm" onClick={() => setFiltersOpen(true)} icon={<Icon name="sliders" className="h-4 w-4" />} disabled={!me.data}>
      Filters{count > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-surface">{count}</span>}
    </Button>
  );
  const profile = current ? full[current.id] : undefined;
  const ready = profile && !(profile instanceof ApiError) ? profile : null;
  const connectionId = current ? `connection-${current.id}` : undefined;
  const viewCompatibility = () => {
    setCompatOpen(true);
    requestAnimationFrame(() => connectionId && document.getElementById(connectionId)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <AppPage wide>
      <div ref={top} className="scroll-mt-24" />
      {/* Phones go straight to the person (the wordmark is in the top bar); larger screens keep the full header. */}
      <div className="hidden md:block">
        <PageHeader title="Discover" lede="One person at a time — people whose intentions and preferences fit with yours, in both directions." actions={filtersButton} />
      </div>
      <div className="-mt-2 mb-4 flex items-center justify-between md:hidden">
        <h1 className="font-serif text-2xl">Discover</h1>
        {filtersButton}
      </div>
      {count > 0 && (
        <div className="-mt-4 mb-6 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-muted">Filtered:</span>
          {filters.intentions.length > 0 && <span className="rounded-full bg-surface px-3 py-1 shadow-soft">{filters.intentions.map(intentionLabel).join(", ")}</span>}
          {(filters.ageMin || filters.ageMax) && (
            <span className="rounded-full bg-surface px-3 py-1 shadow-soft">
              Age {filters.ageMin ?? me.data?.ageMin}–{filters.ageMax ?? me.data?.ageMax}
            </span>
          )}
          {filters.maxDistanceKm && <span className="rounded-full bg-surface px-3 py-1 shadow-soft">Within {filters.maxDistanceKm} km</span>}
          {filters.interests.length > 0 && <span className="rounded-full bg-surface px-3 py-1 shadow-soft">{filters.interests.map((s) => interestNames.get(s) ?? s).join(", ")}</span>}
          <button type="button" onClick={() => applyFilters({ intentions: [], interests: [] })} className="font-semibold text-primary underline-offset-4 hover:underline">
            Clear all
          </button>
        </div>
      )}

      {loading ? (
        <ProfileSkeleton />
      ) : error && !queue.length ? (
        error.status === 400 ? (
          <EmptyState title="Finish your profile first" action={<ButtonLink to="/onboarding">Continue setup</ButtonLink>}>
            {error.message}
          </EmptyState>
        ) : (
          <ErrorState message={error.message} onRetry={() => setParams(params)} />
        )
      ) : !current ? (
        <EmptyState
          title={count ? "No one matches these filters" : "You're all caught up"}
          action={
            count ? (
              <Button onClick={() => applyFilters({ intentions: [], interests: [] })}>Clear filters</Button>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row">
                <ButtonLink to="/app/profile?tab=preferences">Adjust preferences</ButtonLink>
                <ButtonLink to="/app/games" variant="secondary">
                  Play a game
                </ButtonLink>
              </div>
            )
          }
        >
          {count ? "Try widening the age range or distance, or choose different interests." : "You've seen everyone who fits your preferences right now. New people join every day — or widen your age range or distance."}
        </EmptyState>
      ) : (
        <div className="pb-36 md:pb-28">
          {profile instanceof ApiError ? (
            profile.status === 404 ? (
              <EmptyState title="This profile is no longer available" action={<Button onClick={() => advance(current.id)}>Show the next person</Button>} />
            ) : (
              <ErrorState message={profile.message} onRetry={() => setFull((f) => Object.fromEntries(Object.entries(f).filter(([k]) => k !== current.id)))} />
            )
          ) : !ready ? (
            <ProfileSkeleton />
          ) : (
            <div key={ready.id} className="animate-rise">
              <EditorialProfile
                profile={ready}
                onLike={() => act(current, "like")}
                onRespond={(t) => setDetail({ profile: current, target: t })}
                connectionId={connectionId}
                connectionOpen={compatOpen}
                onConnectionToggle={setCompatOpen}
                actions={
                  <div className="flex flex-wrap justify-center gap-3">
                    <Button variant="secondary" size="lg" onClick={() => act(current, "pass")} disabled={!!busy} icon={<Icon name="close" />}>
                      Pass
                    </Button>
                    <Button size="lg" onClick={() => act(current, "like")} disabled={!!busy} icon={<Icon name="heart" />}>
                      Like {ready.displayName}
                    </Button>
                  </div>
                }
              />
            </div>
          )}
          <p className="mt-10 text-center text-xs text-ink-muted">Likes stay private until they're mutual.</p>
        </div>
      )}

      {current && ready && (
        <ActionBar
          name={ready.displayName}
          busy={busy}
          id={current.id}
          onPass={() => act(current, "pass")}
          onLike={() => act(current, "like")}
          onDetail={() => setPicker(true)}
          onCompat={viewCompatibility}
        />
      )}

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <div className="p-6">{me.data ? <DiscoverFilters me={me.data} value={filters} onApply={applyFilters} interestNames={interestNames} /> : <LoadingBlock />}</div>
      </Drawer>
      {current && ready && (
        <DetailPicker
          open={picker}
          profile={ready}
          onClose={() => setPicker(false)}
          onPick={(t) => {
            setPicker(false);
            setDetail({ profile: current, target: t });
          }}
        />
      )}
      {detail && <DetailComposer profile={detail.profile} detail={detail.target} onClose={() => setDetail(null)} onSend={(d, comment) => act(detail.profile, "like", { kind: d.kind, ref: d.ref, comment: comment || undefined })} />}
      {dialog}
    </AppPage>
  );
}

/** Always-visible actions for the person on screen, above the mobile tab bar and clear of the profile content. */
function ActionBar({ name, id, busy, onPass, onLike, onDetail, onCompat }: { name: string; id: string; busy: string | null; onPass: () => void; onLike: () => void; onDetail: () => void; onCompat: () => void }) {
  const working = busy?.startsWith(id) ?? false;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[4.75rem] z-20 flex justify-center px-4 md:bottom-6 md:left-[17rem]">
      <div role="toolbar" aria-label={`Actions for ${name}`} className="pointer-events-auto flex items-center gap-1.5 rounded-full border hairline bg-surface/95 p-1.5 shadow-lift backdrop-blur sm:gap-2 sm:p-2">
        <button type="button" onClick={onPass} disabled={working} aria-label={`Pass on ${name}`} className="flex h-11 w-11 items-center sm:h-12 sm:w-12 justify-center rounded-full border border-line bg-surface text-ink-soft transition hover:border-ink/30 hover:text-ink disabled:opacity-50">
          <Icon name="close" className="h-6 w-6" />
        </button>
        <button type="button" onClick={onCompat} aria-label="View compatibility" className="flex h-11 w-11 items-center sm:h-12 sm:w-12 justify-center rounded-full border border-line bg-surface text-primary transition hover:bg-primary-50">
          <Icon name="spark" className="h-5 w-5" />
        </button>
        <button type="button" onClick={onDetail} disabled={working} className="flex h-11 items-center whitespace-nowrap rounded-full bg-primary px-4 text-[0.82rem] font-semibold text-surface shadow-soft transition hover:bg-primary-hover disabled:opacity-50 sm:h-12 sm:px-5 sm:text-sm">
          Start with a detail
        </button>
        <button type="button" onClick={onLike} disabled={working} aria-label={`Like ${name}`} className="flex h-11 w-11 items-center sm:h-12 sm:w-12 justify-center rounded-full bg-primary text-surface shadow-soft transition hover:bg-primary-hover disabled:opacity-50">
          <Icon name="heart" filled className="h-6 w-6" />
        </button>
      </div>
    </div>
  );
}

/** "Start with a detail": choose a photo, video, prompt or interest to respond to. */
function DetailPicker({ open, profile, onClose, onPick }: { open: boolean; profile: EditorialData; onClose: () => void; onPick: (t: DetailTarget) => void }) {
  const media = mediaOf(profile);
  return (
    <Drawer open={open} onClose={onClose} variant="sheet" title="Start with a detail" description={`Respond to something specific. ${profile.displayName} sees it with your like, and it becomes your first message if you match.`}>
      <div className="space-y-6 p-6">
        {media.length > 0 && (
          <section>
            <h3 className="font-sans text-sm font-semibold">Photos and videos</h3>
            <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {media.map((m, k) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onPick({ kind: "MEDIA", ref: m.id, label: m.kind === "VIDEO" ? "Video" : "Photo", quote: m.caption ?? "", media: m })}
                    className="block w-full rounded-2xl text-left transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Respond to ${m.kind === "VIDEO" ? "video" : "photo"} ${k + 1}${m.caption ? `: ${m.caption}` : ""}`}
                  >
                    <MediaThumb item={m} alt="" className="aspect-[4/5] w-full" />
                    {m.caption && <p className="mt-1 line-clamp-2 text-xs text-ink-soft">{m.caption}</p>}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {(profile.prompts?.length ?? 0) > 0 && (
          <section>
            <h3 className="font-sans text-sm font-semibold">Their words</h3>
            <ul className="mt-3 space-y-2">
              {profile.prompts!.map((pr) => (
                <li key={pr.key}>
                  <button type="button" onClick={() => onPick({ kind: "PROMPT", ref: pr.key, label: pr.text, quote: pr.answer })} className="w-full rounded-2xl border hairline bg-surface p-4 text-left transition hover:border-primary/40">
                    <p className="text-xs font-semibold text-ink-muted">{pr.text}</p>
                    <p className="mt-1 font-serif text-lg leading-snug">{pr.answer}</p>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
        {profile.interests.length > 0 && (
          <section>
            <h3 className="font-sans text-sm font-semibold">Interests</h3>
            <ul className="mt-3 flex flex-wrap gap-2">
              {profile.interests.map((i) => (
                <li key={i.slug}>
                  <button type="button" onClick={() => onPick({ kind: "INTEREST", ref: i.slug, label: "Interest", quote: i.name })} className={cx("rounded-full px-3.5 py-1.5 text-sm transition", i.shared ? "bg-primary text-surface" : "border hairline bg-surface hover:border-primary/40")}>
                    {i.name}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </Drawer>
  );
}

function ProfileSkeleton() {
  return (
    <div role="status" aria-label="Loading profile" className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-end">
      <Skeleton className="aspect-[4/5] w-full rounded-[2rem]" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}
