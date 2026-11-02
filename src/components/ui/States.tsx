import type { ReactNode } from "react";
import { Button } from "./Button";

export function EmptyState({ title, children, action, art }: { title: string; children?: ReactNode; action?: ReactNode; art?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center animate-rise">
      <div className="mb-6">{art ?? <KnotArt />}</div>
      <h2 className="font-serif text-2xl">{title}</h2>
      {children && <div className="mt-2 text-ink-soft">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-md rounded-3xl border border-rose bg-error-soft/60 px-6 py-8 text-center">
      <p className="font-serif text-xl text-ink">That didn't load</p>
      <p className="mt-1 text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

export function KnotArt({ className = "h-24 w-24" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={className} aria-hidden="true">
      <circle cx="60" cy="60" r="56" className="fill-rose-soft" />
      <circle cx="44" cy="62" r="22" fill="none" className="stroke-primary" strokeWidth="5" />
      <circle cx="76" cy="58" r="22" fill="none" className="stroke-gold" strokeWidth="5" />
      <path d="M58 48c4 4 6 9 6 14" className="stroke-primary" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  );
}
