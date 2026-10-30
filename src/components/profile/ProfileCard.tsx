import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "../ui/Badge";
import { Photo } from "../ui/Photo";
import { Icon } from "../ui/Icon";
import { intentionLabel, CONFIDENCE_LABEL } from "../../lib/labels";
import type { CompatSummary, PublicProfile } from "../../lib/types";
import { cx } from "../../lib/format";

const INTENTION_TONE = { SINGLE: "rose", SITUATIONSHIP: "gold", MARRIAGE: "primary" } as const;

export function IntentionBadges({ intentions }: { intentions: PublicProfile["intentions"] }) {
  return (
    <>
      {intentions.map((i) => (
        <Badge key={i} tone={INTENTION_TONE[i]}>
          {intentionLabel(i)}
        </Badge>
      ))}
    </>
  );
}

function isSummary(c: PublicProfile["compatibility"]): c is CompatSummary {
  return !!c && "highlights" in c;
}

/** The Discover card. Photo-led, with the facts people actually decide on. */
export function ProfileCard({ profile, actions, preview, linkToProfile = true }: { profile: PublicProfile; actions?: ReactNode; preview?: boolean; linkToProfile?: boolean }) {
  const [photo, setPhoto] = useState(0);
  const photos = profile.photoIds;
  const compat = isSummary(profile.compatibility) ? profile.compatibility : null;

  return (
    <article className="overflow-hidden rounded-[2rem] border hairline bg-surface shadow-lift" aria-label={`${profile.displayName}${profile.age ? `, ${profile.age}` : ""}`}>
      <div className="relative">
        <Photo id={photos[photo]} alt={`Photo ${photo + 1} of ${profile.displayName}`} className="aspect-[4/5] w-full" rounded="rounded-none" />
        {photos.length > 1 && (
          <>
            <div className="absolute inset-x-4 top-3 flex gap-1.5" aria-hidden="true">
              {photos.map((id, i) => (
                <span key={id} className={cx("h-1 flex-1 rounded-full", i === photo ? "bg-surface" : "bg-surface/40")} />
              ))}
            </div>
            <button type="button" className="absolute inset-y-0 left-0 w-1/3" onClick={() => setPhoto((p) => Math.max(0, p - 1))} aria-label="Previous photo" />
            <button type="button" className="absolute inset-y-0 right-0 w-1/3" onClick={() => setPhoto((p) => Math.min(photos.length - 1, p + 1))} aria-label="Next photo" />
          </>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim/75 via-scrim/20 to-transparent px-6 pb-5 pt-20 text-surface">
          <h2 className="font-serif text-3xl text-surface">
            {profile.displayName}
            {profile.age != null && <span className="font-normal">, {profile.age}</span>}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-surface/85">
            <Icon name="location" className="h-4 w-4" />
            {[profile.city, profile.distance].filter(Boolean).join(" · ") || "Location hidden"}
          </p>
        </div>
      </div>
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap gap-1.5">
          <IntentionBadges intentions={profile.intentions} />
          {profile.zodiac && <Badge tone="gold">{profile.zodiac.symbol} {profile.zodiac.name}</Badge>}
          {profile.isApprovedExpert && <Badge tone="gold">Knot expert</Badge>}
        </div>
        {profile.bio && <p className="leading-relaxed text-ink-soft">{profile.bio}</p>}
        {profile.interests.length > 0 && (
          <div>
            <h3 className="sr-only">Interests</h3>
            <ul className="flex flex-wrap gap-1.5">
              {profile.interests.slice(0, 8).map((i) => (
                <li key={i.slug} className={cx("rounded-full px-3 py-1 text-sm", i.shared ? "bg-primary-50 font-semibold text-primary-700" : "bg-parchment-deep text-ink-soft")}>
                  {i.name}
                  {i.shared && <span className="sr-only"> (shared interest)</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
        {compat && compat.score !== null && (
          <div className="flex items-center gap-4 rounded-2xl bg-rose-mist/70 p-4">
            <div className="text-center">
              <p className="font-serif text-3xl leading-none text-primary">{compat.score}</p>
              <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-wider text-primary-700">overlap</p>
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-semibold text-ink">{compat.highlights[0] ?? (compat.score >= 50 ? "Some overlap in what you've both shared" : "You differ on some of what you've shared")}</p>
              <p className="text-ink-muted">
                {CONFIDENCE_LABEL[compat.confidence]}
                {compat.dealbreakerConflicts > 0 && <span className="font-semibold text-accent"> · conflicts with a dealbreaker</span>}
              </p>
            </div>
          </div>
        )}
        {!preview && linkToProfile && (
          <Link to={`/app/people/${profile.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary underline-offset-4 hover:underline">
            View full profile <Icon name="arrow" className="h-4 w-4" />
          </Link>
        )}
        {actions}
      </div>
    </article>
  );
}
