import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Photo } from "../ui/Photo";
import { IconButton } from "../ui/IconButton";
import { cx } from "../../lib/format";
import type { PhotoRef } from "../../lib/types";

/** Opening photograph(s): swipe on touch, buttons and arrow keys everywhere. */
export function PhotoCarousel({ photos, name, overlay, className }: { photos: PhotoRef[]; name: string; overlay?: ReactNode; className?: string }) {
  const [i, setI] = useState(0);
  const start = useRef<number | null>(null);
  const go = (n: number) => setI(Math.max(0, Math.min(photos.length - 1, n)));
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") go(i + 1);
    if (e.key === "ArrowLeft") go(i - 1);
  };
  const current = photos[i];
  return (
    <section
      aria-roledescription="carousel"
      aria-label={`Photos of ${name}`}
      tabIndex={photos.length > 1 ? 0 : -1}
      onKeyDown={onKey}
      onPointerDown={(e) => (start.current = e.clientX)}
      onPointerUp={(e) => {
        if (start.current === null) return;
        const dx = e.clientX - start.current;
        if (Math.abs(dx) > 40) go(dx < 0 ? i + 1 : i - 1);
        start.current = null;
      }}
      className={cx("relative touch-pan-y select-none overflow-hidden rounded-[2rem] bg-[#EFE4DA]", className)}
    >
      {photos.length ? (
        <Photo key={current.id} id={current.id} focus={current} alt={`Photo ${i + 1} of ${photos.length} of ${name}`} className="h-full w-full animate-[rise_350ms_ease-out_both]" rounded="rounded-none" />
      ) : (
        <Photo alt={`${name} hasn't added a photo yet`} className="h-full w-full" rounded="rounded-none" />
      )}
      {photos.length > 1 && (
        <>
          <ol className="absolute inset-x-5 top-4 flex gap-1.5" aria-hidden="true">
            {photos.map((p, k) => (
              <li key={p.id} className={cx("h-1 flex-1 rounded-full transition-colors", k === i ? "bg-white" : "bg-white/45")} />
            ))}
          </ol>
          <div className="absolute right-4 top-9 flex gap-1.5">
            <IconButton icon="chevronLeft" label="Previous photo" tone="soft" size="sm" disabled={i === 0} onClick={() => go(i - 1)} />
            <IconButton icon="chevronRight" label="Next photo" tone="soft" size="sm" disabled={i === photos.length - 1} onClick={() => go(i + 1)} />
          </div>
          <p className="sr-only" aria-live="polite">
            Photo {i + 1} of {photos.length}
          </p>
        </>
      )}
      {overlay}
    </section>
  );
}
