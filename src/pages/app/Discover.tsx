import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { useConnectionActions } from "../../components/app/MatchDialog";
import { EditorialProfile, type EditorialData } from "../../components/story/EditorialProfile";
import { DetailComposer, type DetailTarget } from "../../components/story/DetailComposer";
import { FeaturedProfile } from "./discover/FeaturedProfile";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Drawer } from "../../components/ui/Drawer";
import { Icon } from "../../components/ui/Icon";
import { LoadMore } from "../../components/ui/LoadMore";
import { Skeleton, LoadingBlock } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { api, ApiError } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { intentionLabel } from "../../lib/labels";
import type { OwnProfile, PublicProfile } from "../../lib/types";
import { DiscoverTile } from "./discover/DiscoverTile";
import { activeFilterCount, DiscoverFilters, filtersFromParams, filtersToQuery, type Filters } from "./discover/DiscoverFilters";

type Page = { items: PublicProfile[]; nextCursor: string | null };

export function Discover() {
  const [params, setParams] = useSearchParams();
  const filters = useMemo(() => filtersFromParams(params), [params]);
  const query = filtersToQuery(filters).toString();
  const me = useResource<OwnProfile>("/profiles/me");
  const interests = useResource<{ slug: string; name: string }[]>("/meta/interests");
  const interestNames = useMemo(() => new Map((interests.data ?? []).map((i) => [i.slug, i.name])), [interests.data]);

  const [items, setItems] = useState<PublicProfile[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [leaving, setLeaving] = useState<Record<string, "like" | "pass">>({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [detail, setDetail] = useState<{ profile: PublicProfile; target: DetailTarget } | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  const fetchPage = useCallback(
    async (from: string | null) => {
      const n = ++seq.current;
      const q = new URLSearchParams(query);
      q.set("limit", "12");
      if (from) q.set("cursor", from);
      const page = await api.get<Page>(`/discovery?${q}`);
      return n === seq.current ? page : null;
    },
    [query],
  );

  // Reload from the start whenever the filters change.
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchPage(null)
      .then((page) => {
        if (!page) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setLoading(false);
      })
      .catch((e) => {
        setError(e instanceof ApiError ? e : new ApiError(0, "UNKNOWN", "Something went wrong."));
        setLoading(false);
      });
  }, [fetchPage]);

  const more = async () => {
    setLoadingMore(true);
    try {
      const page = await fetchPage(cursor);
      if (page) {
        setItems((list) => [...list, ...page.items.filter((p) => !list.some((x) => x.id === p.id))]);
        setCursor(page.nextCursor);
      }
    } catch (e) {
      setError(e instanceof ApiError ? e : null);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load the next page when the end of the list scrolls into view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor || loading) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && !loadingMore && void more(), { rootMargin: "400px" });
    io.observe(el);
    return () => io.disconnect();
  });

  const removeAfter = useCallback((id: string, kind: "like" | "pass") => {
    setLeaving((l) => ({ ...l, [id]: kind }));
    setOpenId((o) => (o === id ? null : o));
    setDetail((d) => (d?.profile.id === id ? null : d));
    setTimeout(() => setItems((list) => list.filter((p) => p.id !== id)), 450);
  }, []);
  const { act, busy, dialog } = useConnectionActions(removeAfter);

  const applyFilters = (f: Filters) => {
    setParams(filtersToQuery(f), { replace: true });
    setFiltersOpen(false);
  };
  const count = activeFilterCount(filters);
  const open = items.find((p) => p.id === openId) ?? null;

  return (
    <AppPage wide>
      <PageHeader
        title="Discover"
        lede="People whose intentions and preferences fit with yours — in both directions."
        actions={
          <Button variant="secondary" size="sm" onClick={() => setFiltersOpen(true)} icon={<Icon name="sliders" className="h-4 w-4" />} disabled={!me.data}>
            Filters{count > 0 && <span className="rounded-full bg-primary px-1.5 text-xs text-surface">{count}</span>}
          </Button>
        }
      />
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
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading profiles">
          {[0, 1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-[1.75rem] border hairline bg-surface">
              <Skeleton className="aspect-[4/5] rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : error && !items.length ? (
        error.status === 400 ? (
          <EmptyState title="Finish your profile first" action={<ButtonLink to="/onboarding">Continue setup</ButtonLink>}>
            {error.message}
          </EmptyState>
        ) : (
          <ErrorState message={error.message} onRetry={() => setParams(params)} />
        )
      ) : !items.length ? (
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
        <>
          {items[0] && (
            <div className="mb-8 animate-rise">
              <FeaturedProfile
                profile={items[0]}
                leaving={leaving[items[0].id] ?? null}
                busy={!!busy}
                onOpen={() => setOpenId(items[0].id)}
                onLike={() => act(items[0], "like")}
                onPass={() => act(items[0], "pass")}
                onRespond={() => {
                  const pr = items[0].prompts?.[0];
                  if (pr) setDetail({ profile: items[0], target: { kind: "PROMPT", ref: pr.key, label: pr.text, quote: pr.answer } });
                }}
              />
            </div>
          )}
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {items.slice(1).map((p) => (
              <li key={p.id} className="animate-rise">
                <DiscoverTile
                  profile={p}
                  leaving={leaving[p.id] ?? null}
                  busy={busy?.startsWith(p.id) ? (busy.endsWith("like") ? "like" : "pass") : null}
                  onOpen={() => setOpenId(p.id)}
                  onLike={() => act(p, "like")}
                  onPass={() => act(p, "pass")}
                />
              </li>
            ))}
          </ul>
          {/* Infinite scroll, with a button as an accessible fallback. */}
          <div ref={sentinel} aria-hidden="true" />
          <LoadMore hasMore={!!cursor} loading={loadingMore} onClick={more} label="Show more people" />
          <p className="mt-8 text-center text-xs text-ink-muted">Likes stay private until they're mutual.</p>
        </>
      )}

      <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filters">
        <div className="p-6">{me.data ? <DiscoverFilters me={me.data} value={filters} onApply={applyFilters} interestNames={interestNames} /> : <LoadingBlock />}</div>
      </Drawer>
      <ProfileDrawer profile={open} onClose={() => setOpenId(null)} onAct={(kind) => open && act(open, kind)} onRespond={(t) => open && setDetail({ profile: open, target: t })} busy={!!busy} />
      {detail && <DetailComposer profile={detail.profile} detail={detail.target} onClose={() => setDetail(null)} onSend={(d, comment) => act(detail.profile, "like", { kind: d.kind, ref: d.ref, comment: comment || undefined })} />}
      {dialog}
    </AppPage>
  );
}

function ProfileDrawer({ profile, onClose, onAct, onRespond, busy }: { profile: PublicProfile | null; onClose: () => void; onAct: (k: "like" | "pass") => void; onRespond: (t: DetailTarget) => void; busy: boolean }) {
  // Full profile (with the compatibility explanation) is loaded on open.
  const detail = useResource<EditorialData>(profile ? `/profiles/${profile.id}` : null);
  return (
    <Drawer
      open={!!profile}
      onClose={onClose}
      title={profile?.displayName ?? ""}
      footer={
        profile && (
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" size="lg" onClick={() => onAct("pass")} disabled={busy} icon={<Icon name="close" />}>
              Pass
            </Button>
            <Button size="lg" onClick={() => onAct("like")} disabled={busy} icon={<Icon name="heart" />}>
              Like
            </Button>
          </div>
        )
      }
    >
      <div className="p-6">
        {detail.loading || !detail.data ? detail.error ? <ErrorState message={detail.error.message} onRetry={detail.reload} /> : <LoadingBlock label="Loading profile" /> : <EditorialProfile profile={detail.data} onRespond={onRespond} />}
      </div>
    </Drawer>
  );
}
