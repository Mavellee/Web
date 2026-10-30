import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../../lib/api";
import type { CoupleState } from "../../lib/couple";
import { useSocketEvent } from "../../lib/socket";
import { useResource } from "../../lib/useResource";
import { Button } from "../ui/Button";
import { ConfirmDialog } from "../ui/ConfirmDialog";
import { Dialog } from "../ui/Dialog";
import { Icon } from "../ui/Icon";
import { useToast } from "../ui/Toast";

const PILL = "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold";

/** The chat-header control for "We're together": asking, answering, and the way into the couple space. */
export function CoupleEntry({ matchId, name }: { matchId: string; name: string }) {
  const { data, reload, setData } = useResource<CoupleState>(`/couple/matches/${matchId}`);
  const toast = useToast();
  const [dialog, setDialog] = useState<"ask" | "answer" | "waiting" | null>(null);
  useSocketEvent<{ matchId: string }>(
    "couple:update",
    useCallback(
      (e) => {
        if (e.matchId === matchId) void reload();
      },
      [matchId, reload],
    ),
  );
  const act = async (action: "request" | "accept" | "decline") => {
    try {
      setData(await api.post<CoupleState>(`/couple/matches/${matchId}/${action}`));
      window.dispatchEvent(new Event("knot:couple"));
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Something went wrong.", "error");
    }
    setDialog(null);
  };
  if (!data) return null;
  if (data.status === "ACTIVE")
    return (
      <Link to="/app/us" aria-label="Our space" className={`${PILL} border-primary/30 bg-primary-50 text-primary-700 hover:bg-primary-50/70`}>
        <Icon name="heart" className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Our space</span>
      </Link>
    );
  return (
    <>
      {data.status === "NONE" && (
        <button type="button" onClick={() => setDialog("ask")} aria-label="We're together" className={`${PILL} hairline bg-surface text-ink-soft hover:bg-parchment`}>
          <Icon name="heart" className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">We're together</span>
        </button>
      )}
      {data.status === "REQUESTED_BY_ME" && (
        <button type="button" onClick={() => setDialog("waiting")} aria-label="Waiting for their answer" className={`${PILL} hairline bg-parchment text-ink-muted`}>
          <Icon name="heart" className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Waiting…</span>
        </button>
      )}
      {data.status === "REQUESTED_BY_THEM" && (
        <button type="button" onClick={() => setDialog("answer")} className={`${PILL} border-primary bg-primary text-surface`}>
          <Icon name="heart" className="h-3.5 w-3.5" />
          Answer {name}
        </button>
      )}
      <ConfirmDialog
        open={dialog === "ask"}
        onClose={() => setDialog(null)}
        title={`Are you and ${name} together?`}
        body={`${name} will be asked to confirm. If they accept, you both get a private couple space with doodling and games, and you're both hidden from Discover while you're together. Your chat stays as it is, and either of you can end this at any time.`}
        confirmLabel="Ask them"
        onConfirm={() => act("request")}
      />
      <ConfirmDialog open={dialog === "waiting"} onClose={() => setDialog(null)} title="Waiting for their answer" body={`You've asked ${name} to confirm you're together. You can cancel this if you changed your mind.`} confirmLabel="Cancel my request" onConfirm={() => act("decline")} />
      <Dialog open={dialog === "answer"} onClose={() => setDialog(null)} title={`${name} says you're together`}>
        <p className="text-ink-soft">If you accept, you both get a private couple space with doodling and games, and you're both hidden from Discover while you're together. Your chat stays as it is, and either of you can end this at any time.</p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="quiet" onClick={() => void act("decline")}>
            Not now
          </Button>
          <Button onClick={() => void act("accept")}>Yes, we're together</Button>
        </div>
      </Dialog>
    </>
  );
}
