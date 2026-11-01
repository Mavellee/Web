import { Link } from "react-router-dom";
import { Icon } from "../ui/Icon";
import { useResource } from "../../lib/useResource";

type AstroState = { available: boolean; eligible?: boolean; status?: string; hasReport?: boolean };

/** Mavelle Astro, kept apart from the profile. Same rule as the chat entry: only for an eligible match, and always optional. */
export function AstroChapter({ matchId, name }: { matchId: string; name: string }) {
  const { data } = useResource<AstroState>(`/astro/matches/${matchId}`);
  if (!data?.available) return null;
  if (!data.hasReport && (data.status === "DECLINED" || !data.eligible)) return null;
  return (
    <section aria-label="Mavelle Astro" className="rounded-[1.75rem] border border-gold/50 bg-gold-soft/40 p-6 sm:p-8">
      <p className="inline-flex items-center gap-2 text-sm font-semibold text-gold-ink">
        <Icon name="star" className="h-4 w-4" /> Mavelle Astro
      </p>
      <h3 className="mt-3 font-serif text-2xl">{data.hasReport ? `Your Cosmic Connection with ${name}` : `A reading for you and ${name}`}</h3>
      <p className="mt-2 text-sm text-ink-soft">{data.hasReport ? "Read the report you both agreed to." : "Optional, and only if you both choose it. For reflection, not a prediction."}</p>
      <Link to={`/app/astro/${matchId}`} className="mt-4 inline-flex min-h-11 items-center gap-1 font-semibold text-primary-text underline-offset-4 hover:underline">
        {data.hasReport ? "Open the report" : "Find out more"} <Icon name="chevronRight" className="h-4 w-4" />
      </Link>
    </section>
  );
}
