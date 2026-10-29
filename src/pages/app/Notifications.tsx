import { useNavigate } from "react-router-dom";
import { AppPage, PageHeader } from "../../components/app/PageHeader";
import { Button } from "../../components/ui/Button";
import { LoadingBlock } from "../../components/ui/Skeleton";
import { EmptyState, ErrorState } from "../../components/ui/States";
import { api } from "../../lib/api";
import { useResource } from "../../lib/useResource";
import { cx, timeAgo } from "../../lib/format";

type Note = { id: string; type: string; title: string; body: string | null; data: { conversationId?: string; matchId?: string; sessionId?: string; requestId?: string }; readAt: string | null; createdAt: string };

export function Notifications() {
  const { data, error, loading, reload } = useResource<{ items: Note[]; unread: number }>("/notifications");
  const navigate = useNavigate();
  const target = (n: Note) =>
    n.data.conversationId ? `/app/messages/${n.data.conversationId}` : n.data.sessionId ? `/app/games/${n.data.sessionId}` : n.data.requestId ? "/app/experts" : n.type === "MATCH" ? "/app/matches" : null;

  return (
    <AppPage>
      <PageHeader
        title="Notifications"
        actions={
          !!data?.unread && (
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                await api.post("/notifications/read-all");
                window.dispatchEvent(new Event("knot:counts"));
                reload();
              }}
            >
              Mark all read
            </Button>
          )
        }
      />
      {loading && !data ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState message={error.message} onRetry={reload} />
      ) : !data?.items.length ? (
        <EmptyState title="Nothing new">Matches, messages and updates will appear here.</EmptyState>
      ) : (
        <ul className="divide-y hairline overflow-hidden rounded-3xl border hairline bg-white/70">
          {data.items.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className="flex w-full items-start gap-4 px-5 py-4 text-left hover:bg-white"
                onClick={async () => {
                  if (!n.readAt) {
                    await api.post(`/notifications/${n.id}/read`);
                    window.dispatchEvent(new Event("knot:counts"));
                  }
                  const t = target(n);
                  if (t) navigate(t);
                  else reload();
                }}
              >
                <span className={cx("mt-2 h-2 w-2 shrink-0 rounded-full", n.readAt ? "bg-transparent" : "bg-plum")} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className={cx("block", !n.readAt && "font-semibold")}>{n.title}</span>
                  {n.body && <span className="block text-sm text-ink-muted">{n.body}</span>}
                </span>
                <span className="shrink-0 text-xs text-ink-muted">{timeAgo(n.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppPage>
  );
}
