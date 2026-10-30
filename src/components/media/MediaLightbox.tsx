import { useEffect, useRef, useState } from "react";
import { photoUrl } from "../../lib/api";
import { cx } from "../../lib/format";
import { Icon } from "../ui/Icon";
import { VideoPlayer } from "./VideoPlayer";
import { MediaThumb } from "./MediaThumb";
import type { MediaItem } from "../../lib/types";

/**
 * Full-screen viewer for a person's whole gallery, photos and videos together, in their chosen order.
 * Built on <dialog> (focus trap, Escape); arrow keys and swipes move between items; videos wait for play.
 */
export function MediaLightbox({ items, name, index, onClose, onLike }: { items: MediaItem[]; name: string; index: number | null; onClose: () => void; onLike?: (item: MediaItem) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [i, setI] = useState(index ?? 0);
  const start = useRef<number | null>(null);
  const open = index !== null && items.length > 0;

  useEffect(() => {
    if (index !== null) setI(index);
  }, [index]);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close?.();
  }, [open]);

  const go = (n: number) => setI(Math.max(0, Math.min(items.length - 1, n)));
  const item = items[i];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-label={`${name}'s photos and videos`}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(i + 1);
        if (e.key === "ArrowLeft") go(i - 1);
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-scrim/95 p-0 text-surface backdrop:bg-scrim/80"
    >
      {open && item && (
        <div
          className="flex h-full flex-col"
          onPointerDown={(e) => (start.current = e.clientX)}
          onPointerUp={(e) => {
            if (start.current === null) return;
            const dx = e.clientX - start.current;
            if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1);
            start.current = null;
          }}
        >
          <header className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <p className="text-sm font-semibold tabular-nums" aria-live="polite">
              {i + 1} / {items.length}
              <span className="sr-only"> — {name}'s photos and videos</span>
            </p>
            <button type="button" onClick={onClose} className="rounded-full p-2.5 hover:bg-surface/10 focus-visible:ring-gold focus-visible:ring-offset-ink" aria-label="Close viewer">
              <Icon name="close" className="h-6 w-6" />
            </button>
          </header>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16">
            {item.kind === "IMAGE" ? (
              <img key={item.id} src={photoUrl(item.id)} alt={item.caption ?? `Photo ${i + 1} of ${name}`} className="max-h-full max-w-full rounded-xl object-contain" />
            ) : (
              <VideoPlayer key={item.id} item={item} label={item.caption ?? `Video ${i + 1} of ${name}`} className="max-h-full max-w-full rounded-xl" />
            )}
            {items.length > 1 && (
              <>
                <NavButton dir="prev" disabled={i === 0} onClick={() => go(i - 1)} />
                <NavButton dir="next" disabled={i === items.length - 1} onClick={() => go(i + 1)} />
              </>
            )}
          </div>
          <footer className="space-y-4 px-4 pb-5 pt-3 sm:px-6">
            {(item.caption || onLike) && (
              <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
                <p className="font-serif text-lg leading-snug">{item.caption}</p>
                {onLike && (
                  <button type="button" onClick={() => onLike(item)} aria-label={`Like this ${item.kind === "VIDEO" ? "video" : "photo"}`} className="shrink-0 rounded-full p-2 hover:bg-surface/10 focus-visible:ring-gold focus-visible:ring-offset-ink">
                    <Icon name="heart" className="h-6 w-6" />
                  </button>
                )}
              </div>
            )}
            {items.length > 1 && (
              <ol className="mx-auto flex max-w-2xl justify-center gap-2 overflow-x-auto pb-1" aria-label="Choose an item">
                {items.map((m, k) => (
                  <li key={m.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => setI(k)}
                      aria-label={`${m.kind === "VIDEO" ? "Video" : "Photo"} ${k + 1}`}
                      aria-current={k === i}
                      className={cx("block overflow-hidden rounded-xl transition", k === i ? "ring-2 ring-rose ring-offset-2 ring-offset-ink" : "opacity-60 hover:opacity-100")}
                    >
                      <MediaThumb item={m} alt="" className="h-14 w-11" rounded="rounded-xl" />
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </footer>
        </div>
      )}
    </dialog>
  );
}

function NavButton({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous" : "Next"}
      className={cx(
        "absolute top-1/2 hidden -translate-y-1/2 rounded-full bg-surface/10 p-3 text-surface transition hover:bg-surface/20 disabled:opacity-25 sm:block",
        dir === "prev" ? "left-3" : "right-3",
      )}
    >
      <Icon name={dir === "prev" ? "chevronLeft" : "chevronRight"} className="h-6 w-6" />
    </button>
  );
}
