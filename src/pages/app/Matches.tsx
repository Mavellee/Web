import { Link } from "react-router-dom";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { IntentionBadges } from "../../components/profile/ProfileCard";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { Photo } from "../../components/ui/Photo";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { useResource } from "../../lib/useResource";
import { timeAgo } from "../../lib/format";
import type { PublicProfile } from "../../lib/types";

type MatchEntry = { id: string; createdAt: string; conversationId: string | null; lastMessageAt: string | null; profile: PublicProfile };

export function Matches() {
  const { data, error, loading, reload } = useResource<MatchEntry[]>("/matches");
  return (
    <AppPage wide>
      <PageHeader title="Matches" lede="You both said yes. Start a conversation, or play a game together when you're ready." />
      {loading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-72 rounded-[1.75rem]" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState
          title="No matches yet"
          action={
            <div className="flex flex-col gap-2 sm:flex-row">
              <ButtonLink to="/app/discover">Discover people</ButtonLink>
              <ButtonLink to="/app/likes" variant="secondary">
                See who liked you
              </ButtonLink>
            </div>
          }
        >
          A match happens when you and someone else both like each other. Check who's already liked you — liking them back creates a match.
        </EmptyState>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((m) => (
            <li key={m.id} className="group overflow-hidden rounded-[1.75rem] border hairline bg-surface shadow-soft transition duration-300 hover:shadow-lift">
              <div className="grid grid-cols-[7.5rem_minmax(0,1fr)]">
                <Link to={`/app/people/${m.profile.id}`} aria-label={`View ${m.profile.displayName}'s profile`}>
                  <Photo id={m.profile.photoIds[0]} alt="" className="h-full min-h-44 w-full" rounded="rounded-none" position="object-top" />
                </Link>
                <div className="flex flex-col p-5">
                  <span className="w-fit rounded-full bg-rose-soft px-2.5 py-0.5 text-xs font-semibold text-primary-700">Mutual match</span>
                  <p className="mt-3 font-serif text-2xl leading-tight">
                    {m.profile.displayName}
                    {m.profile.age != null && <span className="font-normal text-ink-soft">, {m.profile.age}</span>}
                  </p>
                  <p className="text-sm text-ink-muted">
                    Matched {timeAgo(m.createdAt)}
                    {m.lastMessageAt ? ` · last message ${timeAgo(m.lastMessageAt)}` : " · no messages yet"}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <IntentionBadges intentions={m.profile.intentions} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 border-t hairline">
                {m.conversationId && (
                  <Link to={`/app/messages/${m.conversationId}`} className="flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-primary transition hover:bg-primary-50">
                    <Icon name="chat" className="h-4 w-4" /> {m.lastMessageAt ? "Continue" : "Say hello"}
                  </Link>
                )}
                <Link to="/app/games" className="flex items-center justify-center gap-2 border-l hairline py-3.5 text-sm font-semibold text-ink-soft transition hover:bg-ink/5 hover:text-ink">
                  <Icon name="games" className="h-4 w-4" /> Play a game
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}
