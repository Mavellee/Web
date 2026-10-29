import { Link } from "react-router-dom";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { ButtonLink } from "../../components/ui/Button";
import { Avatar } from "../../components/ui/Photo";
import { Skeleton } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { useResource } from "../../lib/useResource";
import { cx, timeAgo } from "../../lib/format";
import type { ConversationSummary, PublicProfile } from "../../lib/types";

type MatchEntry = { id: string; createdAt: string; conversationId: string | null; lastMessageAt: string | null; profile: PublicProfile };

export function Matches() {
  const { data, error, loading, reload } = useResource<MatchEntry[]>("/matches");
  // Last message and unread counts come from the conversations list.
  const convos = useResource<ConversationSummary[]>("/conversations");
  return (
    <AppPage wide>
      <PageHeader title="Matches" lede="You both said yes. Start a conversation, or play a game together when you're ready." />
      {loading ? (
        <div className="mx-auto max-w-2xl space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20 rounded-[1.5rem]" />
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
        <ul className="mx-auto max-w-2xl divide-y hairline overflow-hidden rounded-[1.75rem] border hairline bg-surface/90 shadow-soft">
          {data.map((m) => {
            const convo = convos.data?.find((c) => c.matchId === m.id);
            const last = convo?.lastMessage;
            const unread = convo?.unread ?? 0;
            const when = last?.createdAt ?? m.createdAt;
            const preview = last ? `${last.senderId === m.profile.id ? "" : "You: "}${last.body ?? "Photo"}` : "New match — say hello";
            return (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-parchment/60 sm:px-5">
                <Link to={`/app/people/${m.profile.id}`} aria-label={`View ${m.profile.displayName}'s profile`} className="shrink-0">
                  <Avatar id={m.profile.photoIds[0]} name={m.profile.displayName} size="h-14 w-14" />
                </Link>
                <Link to={m.conversationId ? `/app/messages/${m.conversationId}` : `/app/people/${m.profile.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {m.profile.displayName}
                      {m.profile.age != null && <span className="font-normal text-ink-muted">, {m.profile.age}</span>}
                    </span>
                    <span className={cx("block truncate text-sm", unread ? "font-semibold text-ink" : "text-ink-muted")}>{preview}</span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-xs text-ink-muted">{timeAgo(when)}</span>
                    {unread > 0 ? (
                      <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[0.7rem] font-bold text-surface" aria-label={`${unread} unread`}>
                        {unread}
                      </span>
                    ) : (
                      <span className="h-5" aria-hidden="true" />
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppPage>
  );
}
