import { Button } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";
import { IconButton } from "../../../components/ui/IconButton";
import { Photo } from "../../../components/ui/Photo";
import { IntentionBadges } from "../../../components/profile/ProfileCard";
import { photosOf, sharedSentence } from "../../../lib/profile";
import { cx } from "../../../lib/format";
import type { PublicProfile } from "../../../lib/types";

/** The first person in Discover gets room to breathe: photo, their words and what you share. */
export function FeaturedProfile({ profile: p, onOpen, onLike, onPass, onRespond, busy, leaving }: { profile: PublicProfile; onOpen: () => void; onLike: () => void; onPass: () => void; onRespond: () => void; busy: boolean; leaving: "like" | "pass" | null }) {
  const [first, second] = photosOf(p);
  const prompt = p.prompts?.[0];
  const shared = sharedSentence(p);
  return (
    <article aria-label={`${p.displayName}${p.age ? `, ${p.age}` : ""}`} className={cx("grid overflow-hidden rounded-[2rem] border hairline bg-white shadow-soft transition duration-500 md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]", leaving && "pointer-events-none translate-y-2 opacity-0")}>
      <button type="button" onClick={onOpen} className="relative block" aria-label={`View ${p.displayName}'s full profile`}>
        <Photo id={first?.id} focus={first} alt="" className="aspect-[4/5] h-full w-full md:aspect-auto md:min-h-[30rem]" rounded="rounded-none" />
        {p.isDemo && <span className="absolute left-4 top-4 rounded-full bg-ivory/95 px-2.5 py-0.5 text-[0.7rem] font-semibold text-ink">Demo profile</span>}
      </button>
      <div className="flex flex-col p-6 sm:p-8">
        <p className="eyebrow">Someone to get to know</p>
        <h2 className="mt-3 text-4xl">
          {p.displayName}
          {p.age != null && <span className="font-normal text-ink-soft">, {p.age}</span>}
        </h2>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted">
          <Icon name="location" className="h-4 w-4" />
          {[p.city, p.distance].filter(Boolean).join(" · ")}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          <IntentionBadges intentions={p.intentions} />
        </div>
        {prompt ? (
          <figure className="mt-6">
            <figcaption className="text-sm text-ink-muted">{prompt.text}</figcaption>
            <blockquote className="mt-1 font-serif text-2xl leading-snug">{prompt.answer}</blockquote>
          </figure>
        ) : (
          p.bio && <p className="mt-6 text-lg leading-relaxed text-ink-soft">{p.bio}</p>
        )}
        {shared && <p className="mt-5 text-sm font-semibold text-sage-ink">{shared}</p>}
        {second && (
          <div className="mt-6 hidden gap-3 lg:flex">
            <Photo id={second.id} focus={second} alt={`Another photo of ${p.displayName}`} className="h-28 w-24" rounded="rounded-2xl" />
          </div>
        )}
        <div className="mt-auto space-y-3 pt-8">
          <div className="flex gap-2">
            <IconButton icon="close" label={`Pass on ${p.displayName}`} tone="soft" size="lg" onClick={onPass} disabled={busy} />
            <Button size="lg" className="flex-1" onClick={onLike} disabled={busy} icon={<Icon name="heart" />}>
              Like {p.displayName}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {prompt && (
              <Button variant="secondary" size="sm" onClick={onRespond} disabled={busy} icon={<Icon name="chat" className="h-4 w-4" />}>
                Respond to their answer
              </Button>
            )}
            <Button variant="quiet" size="sm" onClick={onOpen}>
              See full profile
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
