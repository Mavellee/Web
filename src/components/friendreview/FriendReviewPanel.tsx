import { useCallback, useState } from "react";
import { api, ApiError } from "../../lib/api";
import { formatDate } from "../../lib/format";
import { friendLink, verdictLabel, type FriendReviews } from "../../lib/friendReview";
import { useSocketEvent } from "../../lib/socket";
import { useResource } from "../../lib/useResource";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";

export function useFriendReviews(matchId: string) {
  const res = useResource<FriendReviews>(`/friend-reviews/matches/${matchId}`);
  const { reload } = res;
  useSocketEvent<{ matchId: string }>(
    "friend-review:update",
    useCallback(
      (e) => {
        if (e.matchId === matchId) void reload();
      },
      [matchId, reload],
    ),
  );
  return res;
}

function useAct(reload: () => Promise<void>) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const run = async <T,>(path: string): Promise<T | null> => {
    setBusy(true);
    try {
      const r = await api.post<T>(path);
      await reload();
      return r;
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Something went wrong.", "error");
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { run, busy };
}

/** Asked of the person whose profile would be shared. Nothing moves until they agree. */
export function FriendReviewConsent({ matchId, name }: { matchId: string; name: string }) {
  const { data, reload } = useFriendReviews(matchId);
  const { run, busy } = useAct(reload);
  const pending = data?.aboutMe.find((r) => r.status === "PENDING");
  if (!pending) return null;
  return (
    <aside className="border-b hairline bg-primary-50 px-4 py-3 text-sm" aria-label="Friend review request">
      <p className="font-semibold">{name} would like a trusted friend's opinion of your profile</p>
      <p className="mt-0.5 text-ink-soft">One friend gets a private 7-day link showing your name, age, photos and profile answers, but not your location or chats. You won't see what they say. You can stop it any time before they reply, but a friend could still take a screenshot.</p>
      <div className="mt-2 flex gap-2">
        <Button size="sm" loading={busy} onClick={() => void run(`/friend-reviews/${pending.id}/allow`)}>
          Allow
        </Button>
        <Button size="sm" variant="quiet" disabled={busy} onClick={() => void run(`/friend-reviews/${pending.id}/decline`)}>
          Not now
        </Button>
      </div>
    </aside>
  );
}

/** On a match's profile: ask, share the link, read the reply, and see or stop what's been shared about you. */
export function FriendReviewPanel({ matchId, name }: { matchId: string; name: string }) {
  const { data, reload } = useFriendReviews(matchId);
  const { run, busy } = useAct(reload);
  const toast = useToast();
  const [asking, setAsking] = useState(false);
  const [link, setLink] = useState<{ id: string; url: string } | null>(null);
  if (!data) return null;
  const latest = data.mine[0];
  const replies = data.mine.filter((r) => r.status === "REVIEWED");
  const open = latest && (latest.status === "PENDING" || latest.status === "ALLOWED") ? latest : null;
  const sharedAboutMe = data.aboutMe.find((r) => r.status === "ALLOWED");
  const make = async (id: string) => {
    const r = await run<{ token: string }>(`/friend-reviews/${id}/link`);
    if (r) setLink({ id, url: friendLink(r.token) });
  };
  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    } catch {
      toast("Couldn't copy. Select the link and copy it yourself.", "error");
    }
  };
  return (
    <Card className="mb-6 p-5">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary-50 text-primary">
          <Icon name="eye" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg">Ask a trusted friend</h2>
          <p className="mt-0.5 text-sm text-ink-soft">Get a second opinion from someone who knows you. Only you see what they say, and it never affects your match.</p>

          {open?.status === "PENDING" && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="text-ink-muted">Waiting for {name} to agree.</span>
              <Button size="sm" variant="quiet" disabled={busy} onClick={() => void run(`/friend-reviews/${open.id}/revoke`)}>
                Cancel
              </Button>
            </div>
          )}

          {open?.status === "ALLOWED" && (
            <div className="mt-3 space-y-3 text-sm">
              {link?.id === open.id ? (
                <div className="rounded-2xl border hairline bg-surface p-3">
                  <p className="font-semibold">Send this to one friend</p>
                  <p className="mt-1 break-all text-ink-soft">{link.url}</p>
                  <p className="mt-1 text-xs text-ink-muted">Anyone with this link can see {name}'s profile for 7 days, so send it only to the friend you mean. It's shown only now.</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void copy(link.url)}>
                      Copy link
                    </Button>
                    <a href={`https://wa.me/?text=${encodeURIComponent(`Can you give me your honest opinion on someone? ${link.url}`)}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center rounded-full border border-primary/25 bg-surface/70 px-4 text-sm font-semibold text-primary hover:border-primary/50">
                      Send on WhatsApp
                    </a>
                  </div>
                </div>
              ) : open.linkLive ? (
                <p className="text-ink-muted">A link is active until {formatDate(open.expiresAt!)}. Waiting for your friend.</p>
              ) : (
                <p className="text-ink-muted">{name} said yes. Create a private link for your friend.</p>
              )}
              <div className="flex flex-wrap gap-2">
                {link?.id !== open.id && (
                  <Button size="sm" loading={busy} onClick={() => void make(open.id)}>
                    {open.linkLive ? "Replace link" : "Create private link"}
                  </Button>
                )}
                <Button size="sm" variant="quiet" disabled={busy} onClick={() => void run(`/friend-reviews/${open.id}/revoke`).then(() => setLink(null))}>
                  Stop sharing
                </Button>
              </div>
            </div>
          )}

          {!open && (
            <div className="mt-3">
              {latest?.status === "DECLINED" && <p className="mb-2 text-sm text-ink-muted">{name} preferred not to share their profile.</p>}
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => setAsking(true)}>
                Ask {name} to allow it
              </Button>
            </div>
          )}

          {replies.map((r) => (
            <div key={r.id} className="mt-3 rounded-2xl bg-rose-mist p-3 text-sm">
              <p className="font-semibold">
                {r.friendName}: {verdictLabel(r.verdict)}
              </p>
              {r.comment && <p className="mt-1 whitespace-pre-wrap text-ink-soft">{r.comment}</p>}
              <button type="button" disabled={busy} onClick={() => void run(`/friend-reviews/${r.id}/revoke`)} className="mt-1 text-xs font-semibold text-ink-muted hover:text-ink">
                Delete this reply
              </button>
            </div>
          ))}

          {sharedAboutMe && (
            <div className="mt-3 border-t hairline pt-3 text-sm">
              <p className="text-ink-soft">{sharedAboutMe.linkLive ? `A friend of ${name}'s can view your profile until ${formatDate(sharedAboutMe.expiresAt!)}.` : `You allowed ${name} to share your profile with a friend.`}</p>
              <Button size="sm" variant="quiet" className="mt-1" disabled={busy} onClick={() => void run(`/friend-reviews/${sharedAboutMe.id}/revoke`)}>
                Stop sharing my profile
              </Button>
            </div>
          )}
        </div>
      </div>
      <ConfirmDialog
        open={asking}
        onClose={() => setAsking(false)}
        title={`Ask ${name} first`}
        body={`${name} will be told you'd like a friend's opinion, and nothing is shared unless they agree. Your friend's reply stays private to you.`}
        confirmLabel="Ask them"
        onConfirm={async () => {
          await run(`/friend-reviews/matches/${matchId}`);
          setAsking(false);
        }}
      />
    </Card>
  );
}
