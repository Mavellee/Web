import { Link } from "react-router-dom";

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect width="40" height="40" rx="12" fill="#76506F" />
      <path d="M14 13c-4 0-6.5 3.2-6.5 7s2.5 7 6.5 7c3 0 5-2.4 6.2-4.8l2.4-4.4C23.8 15.4 25.8 13 29 13c4 0 6.5 3.2 6.5 7S33 27 29 27c-3 0-5-2.4-6.2-4.8" fill="none" stroke="#FFF8F2" strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="10" r="2" fill="#D4A574" />
    </svg>
  );
}

export function Logo({ to = "/" }: { to?: string }) {
  return (
    <Link to={to} className="group inline-flex items-center gap-2.5 rounded-full" aria-label="Knot home">
      <LogoMark className="h-9 w-9 transition-transform duration-300 group-hover:-rotate-6" />
      <span className="font-serif text-2xl font-semibold tracking-tight text-ink">knot</span>
    </Link>
  );
}
