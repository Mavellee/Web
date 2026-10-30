import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Logo } from "../ui/Logo";
import { ThemeToggle } from "../ui/ThemeToggle";
import { ButtonLink } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { useAuth } from "../../lib/auth";
import { cx } from "../../lib/format";

const NAV = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/intentions", label: "Intentions" },
  { to: "/safety", label: "Safety" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Support" },
];

export function PublicLayout() {
  const { account } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname, hash } = useLocation();
  useEffect(() => {
    setOpen(false);
    // Honour in-page anchors such as /intentions#marriage; otherwise start at the top.
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-dvh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-primary focus:px-4 focus:py-2 focus:text-surface">
        Skip to content
      </a>
      <header className="sticky top-0 z-30 border-b border-transparent bg-parchment/85 backdrop-blur supports-[backdrop-filter]:bg-parchment/75">
        <div className="container-page flex h-[4.5rem] items-center justify-between py-3">
          <Logo />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => cx("rounded-full px-4 py-2 text-sm font-medium transition", isActive ? "text-primary" : "text-ink-soft hover:text-ink")}>
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <ThemeToggle className="text-ink-soft hover:bg-ink/5" />
            {account ? (
              <ButtonLink to="/app">Open Knot</ButtonLink>
            ) : (
              <>
                <ButtonLink to="/login" variant="ghost">
                  Log in
                </ButtonLink>
                <ButtonLink to="/signup">Join Knot</ButtonLink>
              </>
            )}
          </div>
          <ThemeToggle className="ml-auto text-ink-soft md:hidden" />
          <button type="button" className="rounded-full p-2 text-ink md:hidden" aria-expanded={open} aria-controls="mobile-nav" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)}>
            <Icon name={open ? "close" : "menu"} className="h-6 w-6" />
          </button>
        </div>
        {open && (
          <nav id="mobile-nav" aria-label="Main" className="container-page animate-rise pb-6 md:hidden">
            <ul className="space-y-1 border-t hairline pt-4">
              {NAV.map((n) => (
                <li key={n.to}>
                  <Link to={n.to} className="block rounded-2xl px-3 py-3 font-serif text-xl text-ink">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {account ? (
                <ButtonLink to="/app" className="col-span-2">
                  Open Knot
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink to="/login" variant="secondary">
                    Log in
                  </ButtonLink>
                  <ButtonLink to="/signup">Join Knot</ButtonLink>
                </>
              )}
            </div>
          </nav>
        )}
      </header>
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function Footer() {
  const cols = [
    { title: "Knot", links: [["How it works", "/how-it-works"], ["Relationship intentions", "/intentions"], ["About Knot", "/about"]] },
    { title: "Trust", links: [["Safety & privacy", "/safety"], ["Community guidelines", "/guidelines"], ["Contact & support", "/contact"]] },
    { title: "Legal", links: [["Terms of service", "/terms"], ["Privacy policy", "/privacy"]] },
  ];
  return (
    <footer className="mt-24 bg-panel text-surface/80">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs">
          <Logo tone="light" />
          <p className="mt-4 font-serif text-lg italic text-surface">Find your kind of connection.</p>
          <p className="mt-3 text-sm text-surface/75">For adults aged 18 and over.</p>
        </div>
        {cols.map((c) => (
          <div key={c.title}>
            <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.18em] text-gold">{c.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {c.links.map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-surface/80 transition hover:text-surface focus-visible:ring-gold focus-visible:ring-offset-primary">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-page flex flex-col gap-2 border-t border-surface/15 py-6 text-xs text-surface/70 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} Knot. All rights reserved.</p>
        <p>Legal pages are drafts pending professional legal review.</p>
      </div>
    </footer>
  );
}
