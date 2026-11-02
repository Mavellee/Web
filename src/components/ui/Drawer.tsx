import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "./IconButton";

/** Side panel on desktop, bottom sheet on mobile. Built on <dialog> for focus handling and Escape. */
const VARIANTS = {
  // Side panel on desktop, bottom sheet on mobile.
  side: "sm:ml-auto sm:mt-0 sm:h-dvh sm:w-[min(36rem,92vw)] sm:rounded-none sm:rounded-l-4xl",
  // Centred modal on desktop, bottom sheet on mobile.
  sheet: "sm:m-auto sm:h-auto sm:max-h-[88dvh] sm:w-[min(46rem,92vw)] sm:rounded-4xl",
};

export function Drawer({ open, onClose, title, children, footer, variant = "side", description }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; variant?: keyof typeof VARIANTS; description?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close?.();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      aria-labelledby="drawer-title"
      className={`m-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-t-4xl bg-parchment p-0 text-ink shadow-lift backdrop:bg-scrim/35 ${variant === "side" ? "h-[92dvh]" : ""} ${VARIANTS[variant]}`}
    >
      {open && (
        <div className="flex h-full max-h-[inherit] flex-col">
          <header className="flex items-center justify-between gap-4 border-b hairline px-6 py-4">
            <div className="min-w-0">
              <h2 id="drawer-title" className="truncate font-serif text-2xl">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-sm text-ink-muted">{description}</p>}
            </div>
            <IconButton icon="close" label="Close" onClick={onClose} />
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <footer className="border-t hairline bg-parchment px-6 py-4">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
