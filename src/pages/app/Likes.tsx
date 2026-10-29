import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { useConnectionActions } from "../../components/app/MatchDialog";
import { IntentionBadges } from "../../components/profile/ProfileCard";
import { Button, ButtonLink } from "../../components/ui/Button";
import { Photo } from "../../components/ui/Photo";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { Tabs } from "../../components/ui/Tabs";
import { useResource } from "../../lib/useResource";
import { timeAgo } from "../../lib/format";
import { DetailMediaThumb } from "../../components/media/MediaThumb";
import type { LikeDetail, PublicProfile } from "../../lib/types";

type LikeEntry = { likedAt: string; profile: PublicProfile; detail: LikeDetail | null; comment: string | null };

export function Likes() {
  const [tab, setTab] = useState<"received" | "sent">("received");
  const { data, error, loading, reload, setData } = useResource<LikeEntry[]>(`/likes/${tab}`);
  const remove = useCallback((id: string) => setData((d) => d?.filter((x) => x.profile.id !== id) ?? null), [setData]);
  const { act, busy, dialog } = useConnectionActions(remove);

  return (
    <AppPage wide>
      <PageHeader
        title="Likes"
        lede="Likes are one-sided until both of you say yes. Like someone back to match — matches live in Matches."
        actions={
          <ButtonLink to="/app/matches" variant="secondary" size="sm">
            View matches
          </ButtonLink>
        }
      />
      <Tabs
        label="Likes"
        className="mb-8"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "received", label: "Liked you", count: tab === "received" ? data?.length : undefined },
          { value: "sent", label: "You liked", count: tab === "sent" ? data?.length : undefined },
        ]}
      />
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-[1.75rem]" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState title={tab === "received" ? "No new likes yet" : "You haven't liked anyone yet"} action={<ButtonLink to="/app/discover">Go to Discover</ButtonLink>}>
          {tab === "received"
            ? "When someone likes you, they'll appear here. A complete profile with a few answered questions helps the right people find you — we never invent likes."
            : "People you like stay here until they like you back. Then you'll find them in Matches."}
        </EmptyState>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map(({ profile: p, likedAt, detail, comment }) => (
            <li key={p.id} className="flex flex-col overflow-hidden rounded-[1.75rem] border hairline bg-surface shadow-soft">
              <Link to={`/app/people/${p.id}`} className="relative block" aria-label={`View ${p.displayName}'s profile`}>
                <Photo id={p.photoIds[0]} alt="" className="aspect-[4/5] w-full" rounded="rounded-none" position="object-top" />
                <span className="absolute left-3 top-3 rounded-full bg-parchment/95 px-3 py-1 text-xs font-semibold text-ink shadow-soft">
                  {tab === "received" ? "Liked you" : "You liked"} · {timeAgo(likedAt)}
                </span>
              </Link>
              <div className="flex flex-1 flex-col p-5">
                <p className="font-serif text-2xl">
                  {p.displayName}
                  {p.age != null && <span className="font-normal text-ink-soft">, {p.age}</span>}
                </p>
                <p className="text-sm text-ink-muted">{p.city}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <IntentionBadges intentions={p.intentions} />
                </div>
                {detail && (
                  <figure className="mt-4 rounded-2xl bg-rose-mist/60 p-3">
                    <figcaption className="text-xs text-ink-muted">
                      {tab === "received" ? "Responded to your" : "You responded to their"} {detail.kind === "PROMPT" ? `answer: ${detail.label}` : detail.kind === "MEDIA" ? detail.label.toLowerCase() : "interest"}
                    </figcaption>
                    {detail.kind === "MEDIA" && detail.mediaId && <DetailMediaThumb id={detail.mediaId} kind={detail.mediaKind} className="mt-2 h-24 w-20" />}
                    {detail.quote && <blockquote className="mt-0.5 font-serif leading-snug">{detail.quote}</blockquote>}
                    {comment && <p className="mt-2 border-t border-primary/10 pt-2 text-sm text-ink">“{comment}”</p>}
                  </figure>
                )}
                {tab === "received" ? (
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
                    <Button variant="secondary" size="sm" onClick={() => act(p, "pass")} disabled={!!busy}>
                      Not for me
                    </Button>
                    <Button size="sm" onClick={() => act(p, "like")} loading={busy === `${p.id}:like`}>
                      Like back
                    </Button>
                  </div>
                ) : (
                  <p className="mt-auto pt-5 text-sm text-ink-muted">Waiting — you'll match if they like you too.</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {dialog}
    </AppPage>
  );
}
