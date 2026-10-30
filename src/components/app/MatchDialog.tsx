import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import type { PublicProfile } from "../../lib/types";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import { Photo } from "../ui/Photo";
import { useToast } from "../ui/Toast";

type LikeResult = { matched: boolean; matchId: string | null; alreadyLiked: boolean; astroAvailable?: boolean };

/** Like/pass actions shared by Discover, Likes and profile pages. A match dialog appears only for a real mutual match. */
export function useConnectionActions(onDone?: (id: string, kind: "like" | "pass") => void) {
  const [matched, setMatched] = useState<{ profile: PublicProfile; matchId: string; astro: boolean } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const toast = useToast();

  const act = useCallback(
    async (profile: PublicProfile, kind: "like" | "pass", detail?: { kind: "PROMPT" | "INTEREST" | "MEDIA"; ref: string; comment?: string }) => {
      setBusy(`${profile.id}:${kind}`);
      try {
        if (kind === "like") {
          const r = await api.post<LikeResult>("/likes", { userId: profile.id, detail });
          if (r.matched && r.matchId) setMatched({ profile, matchId: r.matchId, astro: !!r.astroAvailable });
          else toast(detail?.comment ? `Sent to ${profile.displayName} with your like. If you match, it starts your conversation.` : `You liked ${profile.displayName}. If they like you too, you'll match.`, "info");
        } else {
          await api.post("/likes/pass", { userId: profile.id });
        }
        onDone?.(profile.id, kind);
        return true;
      } catch (e) {
        toast(e instanceof ApiError ? e.message : "That didn't go through. Try again.", "error");
        return false;
      } finally {
        setBusy(null);
      }
    },
    [onDone, toast],
  );

  const dialog = <MatchDialog matched={matched} onClose={() => setMatched(null)} />;
  return { act, busy, dialog };
}

function MatchDialog({ matched, onClose }: { matched: { profile: PublicProfile; matchId: string; astro: boolean } | null; onClose: () => void }) {
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  return (
    <Dialog open={!!matched} onClose={onClose} title="It's mutual" description={matched ? `You and ${matched.profile.displayName} liked each other.` : undefined}>
      {matched && (
        <div className="text-center">
          <Photo id={matched.profile.photoIds[0]} alt={matched.profile.displayName} className="mx-auto h-36 w-36" rounded="rounded-full" position="object-top" />
          <p className="mt-4 text-ink-soft">There's no rush. Say hello when you're ready — a simple, genuine question is a great start.</p>
          {matched.astro && (
            <div className="mt-5 rounded-3xl border border-gold/40 bg-gold-soft/40 p-4">
              <p className="font-serif text-lg leading-snug">You've found a connection. Shall we discover what the stars say?</p>
              <p className="mt-1 text-sm text-ink-muted">Knot Astro is optional, and your chat is open either way.</p>
              <Button
                className="mt-3 w-full"
                variant="secondary"
                onClick={() => {
                  onClose();
                  navigate(`/app/astro/${matched.matchId}`);
                }}
              >
                Explore Our Compatibility
              </Button>
            </div>
          )}
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Button variant="secondary" onClick={onClose}>
              Keep exploring
            </Button>
            <Button
              loading={opening}
              onClick={async () => {
                setOpening(true);
                try {
                  const matches = await api.get<{ id: string; conversationId: string | null }[]>("/matches");
                  const m = matches.find((x) => x.id === matched.matchId);
                  onClose();
                  navigate(m?.conversationId ? `/app/messages/${m.conversationId}` : "/app/matches");
                } finally {
                  setOpening(false);
                }
              }}
            >
              {matched.astro ? "Skip and Start Chatting" : "Say hello"}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
