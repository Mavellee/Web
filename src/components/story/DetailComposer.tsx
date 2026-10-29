import { useState } from "react";
import { Button } from "../ui/Button";
import { Dialog } from "../ui/Dialog";
import type { MediaItem, PublicProfile } from "../../lib/types";
import { MediaThumb } from "../media/MediaThumb";

export interface DetailTarget {
  kind: "PROMPT" | "INTEREST" | "MEDIA";
  ref: string;
  label: string;
  quote: string;
  media?: MediaItem;
}

/**
 * "Start with a detail": like someone by responding to something specific on their profile.
 * Before a match this travels with the like; if you match, it becomes your first message.
 */
export function DetailComposer({ profile, detail, onClose, onSend }: { profile: PublicProfile; detail: DetailTarget | null; onClose: () => void; onSend: (d: DetailTarget, comment: string) => Promise<boolean> }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Dialog open={!!detail} onClose={onClose} title={`Respond to ${profile.displayName}`} description="They'll see this with your like. If you both like each other, it becomes the first message in your chat.">
      {detail && (
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const ok = await onSend(detail, comment.trim());
            setBusy(false);
            if (ok) {
              setComment("");
              onClose();
            }
          }}
        >
          <figure className="flex gap-4 rounded-3xl bg-parchment-deep/70 p-4">
            {detail.media && <MediaThumb item={detail.media} alt={`${profile.displayName}'s ${detail.label.toLowerCase()}`} className="h-24 w-20 shrink-0" />}
            <div className="min-w-0">
              <figcaption className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-muted">{detail.label}</figcaption>
              {detail.quote && <blockquote className="mt-1 font-serif text-lg leading-snug">{detail.quote}</blockquote>}
            </div>
          </figure>
          <div>
            <label htmlFor="detail-comment" className="text-sm font-semibold">
              Your note <span className="font-normal text-ink-muted">(optional)</span>
            </label>
            <textarea
              id="detail-comment"
              value={comment}
              maxLength={300}
              rows={3}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ask about it, share yours, or simply say what caught your eye."
              className="mt-1.5 block w-full resize-y rounded-2xl border border-line bg-surface px-4 py-3 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
            <p className="mt-1 text-right text-xs text-ink-muted">{comment.length}/300</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="quiet" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={busy}>
              {comment.trim() ? "Send with a like" : "Like this"}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  );
}
