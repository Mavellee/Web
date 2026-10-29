import { useEffect, useRef, useState } from "react";
import { photoUrl } from "../../lib/api";
import { cx } from "../../lib/format";
import { Icon } from "../ui/Icon";
import { VideoPlayer } from "./VideoPlayer";
import type { MediaItem } from "../../lib/types";

/**
 * Full-screen viewer for a person's whole gallery, photos and videos together, in their chosen order.
 * Built on <dialog> (focus trap, Escape); arrow keys and swipes move between items; videos wait for play.
 */
export function MediaLightbox({ items, name, index, onClose }: { items: MediaItem[]; name: string; index: number | null; onClose: () => void }) {
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
      className="m-0 h-dvh max-h-none w-screen max-w-none bg-ink/95 p-0 text-surface backdrop:bg-ink/80"
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
            <p className="text-sm font-semibold" aria-live="polite">
              {name} · {i + 1} of {items.length}
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
          <footer className="space-y-3 px-4 pb-5 pt-3 sm:px-6">
            {item.caption && <p className="mx-auto max-w-2xl text-center font-serif text-lg leading-snug">{item.caption}</p>}
            {items.length > 1 && (
              <ol className="mx-auto flex max-w-md justify-center gap-1.5" aria-label="Choose an item">
                {items.map((m, k) => (
                  <li key={m.id}>
                    <button
                      type="button"
                      onClick={() => setI(k)}
                      aria-label={`${m.kind === "VIDEO" ? "Video" : "Photo"} ${k + 1}`}
                      aria-current={k === i}
                      className={cx("block h-1.5 rounded-full transition-all", k === i ? "w-6 bg-gold" : "w-1.5 bg-surface/40 hover:bg-surface/70")}
                    />
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
