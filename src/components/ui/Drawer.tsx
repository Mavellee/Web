import { useEffect, useRef, type ReactNode } from "react";
import { IconButton } from "./IconButton";

/** Side panel on desktop, bottom sheet on mobile. Built on <dialog> for focus handling and Escape. */
export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
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
      className="m-0 mt-auto h-[92dvh] max-h-none w-full max-w-none rounded-t-4xl bg-ivory p-0 text-ink shadow-lift backdrop:bg-ink/35 sm:ml-auto sm:mt-0 sm:h-dvh sm:w-[min(36rem,92vw)] sm:rounded-none sm:rounded-l-4xl"
    >
      {open && (
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between gap-4 border-b hairline px-6 py-4">
            <h2 id="drawer-title" className="truncate text-2xl">
              {title}
            </h2>
            <IconButton icon="close" label="Close" onClick={onClose} />
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <footer className="border-t hairline bg-ivory px-6 py-4">{footer}</footer>}
        </div>
      )}
    </dialog>
  );
}
