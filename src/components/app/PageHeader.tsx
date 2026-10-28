import type { ReactNode } from "react";

export function PageHeader({ title, lede, actions, eyebrow }: { title: string; lede?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="text-4xl sm:text-[2.75rem]">{title}</h1>
        {lede && <p className="mt-2 max-w-2xl text-ink-soft">{lede}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </header>
  );
}

export function AppPage({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return <div className={wide ? "mx-auto w-full max-w-6xl px-4 py-8 sm:px-8 md:py-12" : "mx-auto w-full max-w-4xl px-4 py-8 sm:px-8 md:py-12"}>{children}</div>;
}
