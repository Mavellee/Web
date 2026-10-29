import { Badge } from "../../../components/ui/Badge";
import { IconButton } from "../../../components/ui/IconButton";
import { Icon } from "../../../components/ui/Icon";
import { Photo } from "../../../components/ui/Photo";
import { IntentionBadges } from "../../../components/profile/ProfileCard";
import { cx } from "../../../lib/format";
import { photosOf, sharedSentence } from "../../../lib/profile";
import type { CompatSummary, PublicProfile } from "../../../lib/types";

export function DiscoverTile({ profile: p, onOpen, onLike, onPass, busy, leaving }: { profile: PublicProfile; onOpen: () => void; onLike: () => void; onPass: () => void; busy: "like" | "pass" | null; leaving: "like" | "pass" | null }) {
  const compat = p.compatibility && "highlights" in p.compatibility ? (p.compatibility as CompatSummary) : null;
  return (
    <article
      aria-label={`${p.displayName}${p.age ? `, ${p.age}` : ""}`}
      className={cx(
        "group flex flex-col overflow-hidden rounded-[1.75rem] border hairline bg-white shadow-soft transition duration-500",
        leaving === "like" && "pointer-events-none -translate-y-2 scale-[0.98] opacity-0",
        leaving === "pass" && "pointer-events-none translate-y-2 opacity-0",
      )}
    >
      <button type="button" onClick={onOpen} className="relative block text-left" aria-label={`View ${p.displayName}'s full profile`}>
        <Photo id={photosOf(p)[0]?.id} focus={photosOf(p)[0]} alt="" className="aspect-[4/5] w-full" rounded="rounded-none" />
        {p.isDemo && <span className="absolute left-3 top-3 rounded-full bg-ivory/95 px-2.5 py-0.5 text-[0.7rem] font-semibold text-ink">Demo profile</span>}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent px-5 pb-4 pt-16 text-ivory">
          <h2 className="font-serif text-[1.65rem] leading-tight text-ivory">
            {p.displayName}
            {p.age != null && <span className="font-normal">, {p.age}</span>}
          </h2>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-ivory/85">
            <Icon name="location" className="h-3.5 w-3.5" />
            {[p.city, p.distance].filter(Boolean).join(" · ") || "Location hidden"}
          </p>
        </div>
        {compat?.score != null && (
          <span className="absolute right-3 top-3 rounded-full bg-ivory/95 px-3 py-1 text-xs font-semibold text-plum-700 shadow-soft">
            {compat.score}% overlap
          </span>
        )}
        {leaving === "like" && <span className="absolute inset-0 flex items-center justify-center bg-plum/40 text-lg font-semibold text-ivory">Liked</span>}
      </button>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap gap-1.5">
          <IntentionBadges intentions={p.intentions} />
          {p.isApprovedExpert && <Badge tone="gold">Knot expert</Badge>}
        </div>
        {p.prompts?.[0] ? (
          <figure>
            <figcaption className="text-xs text-ink-muted">{p.prompts[0].text}</figcaption>
            <blockquote className="mt-0.5 line-clamp-2 font-serif text-[1.05rem] leading-snug">{p.prompts[0].answer}</blockquote>
          </figure>
        ) : (
          p.bio && <p className="line-clamp-2 text-sm leading-relaxed text-ink-soft">{p.bio}</p>
        )}
        {sharedSentence(p) && <p className="text-xs font-semibold text-sage-ink">{sharedSentence(p)}</p>}
        {p.interests.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Interests">
            {p.interests.slice(0, 3).map((i) => (
              <li key={i.slug} className={cx("rounded-full px-2.5 py-0.5 text-xs", i.shared ? "bg-plum-50 font-semibold text-plum-700" : "bg-ivory-deep text-ink-soft")}>
                {i.name}
                {i.shared && <span className="sr-only"> (shared)</span>}
              </li>
            ))}
            {p.interests.length > 3 && <li className="px-1 text-xs text-ink-muted">+{p.interests.length - 3}</li>}
          </ul>
        )}
        {compat?.dealbreakerConflicts ? <p className="text-xs font-semibold text-rose-ink">Conflicts with a dealbreaker</p> : null}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <IconButton icon="close" label={`Pass on ${p.displayName}`} tone="soft" onClick={onPass} disabled={!!busy} />
          <button type="button" onClick={onOpen} className="h-11 flex-1 rounded-full text-sm font-semibold text-ink-soft transition hover:bg-ink/5 hover:text-ink">
            View profile
          </button>
          <IconButton icon="heart" label={`Like ${p.displayName}`} tone="solid" onClick={onLike} disabled={!!busy} />
        </div>
      </div>
    </article>
  );
}
