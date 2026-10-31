import { ButtonLink } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="container-page pb-20 pt-14 sm:pt-20 lg:pb-28">
        <div className="mx-auto flex max-w-4xl animate-rise flex-col items-center text-center">
          <p className="eyebrow">Intentional dating for adults · 18+</p>
          <h1 id="hero-title" className="mt-6 text-[2.6rem] leading-[1.06] sm:text-[3.6rem] lg:text-[4.5rem]">
            Not just a match.
            <span className="block italic text-primary">A connection that makes sense.</span>
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-soft sm:text-xl">
            Mavelle begins with what you're looking for — something open, something undefined, or something for life — and shows you why someone might fit, using only what you both chose to share.
          </p>
          <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:flex-row">
            <ButtonLink to="/signup" size="lg">
              Find your connection
            </ButtonLink>
            <ButtonLink to="/how-it-works" size="lg" variant="secondary">
              Discover how Mavelle works
            </ButtonLink>
          </div>
        </div>
        <HeroComposition />
        <dl className="mx-auto mt-16 grid max-w-3xl gap-8 border-t hairline pt-8 text-center text-sm sm:grid-cols-3">
          {[
            ["Mutual", "Matches only when you both say yes"],
            ["Private", "Exact location and birth date never shown"],
            ["Optional", "AI and experts, only if you want them"],
          ].map(([t, d]) => (
            <div key={t}>
              <dt className="font-serif text-xl text-ink">{t}</dt>
              <dd className="mx-auto mt-1 max-w-[15rem] leading-snug text-ink-muted">{d}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function HeroComposition() {
  return (
    <figure className="mx-auto mt-14 max-w-5xl animate-rise [animation-delay:120ms] sm:mt-16">
      <div className="grid grid-cols-2 items-center gap-4 md:grid-cols-[1fr_1.05fr_1fr] md:gap-6">
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift">
          <img src="/images/people/p13.jpg" alt="Illustrative portrait of a woman in a patterned collar" className="h-full w-full object-cover object-top" fetchPriority="high" />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-scrim/70 to-transparent p-4 pt-16 text-surface">
            <p className="font-serif text-xl">Amara, 29</p>
            <p className="text-xs text-surface/80">Data scientist · Bengaluru</p>
          </div>
        </div>
        {/* Compatibility note: what Mavelle actually shows, in miniature */}
        <div className="order-last col-span-2 rounded-3xl border hairline bg-surface p-5 shadow-lift sm:p-6 md:order-none md:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">Why you might connect</p>
            <Icon name="spark" className="h-4 w-4 text-gold" />
          </div>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-center justify-between gap-3">
              <span>Long-term commitment</span>
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">Both</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>How you handle conflict</span>
              <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-semibold text-primary-700">Aligned</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span>Weekends</span>
              <span className="shrink-0 rounded-full bg-ink/5 px-2 py-0.5 text-xs font-semibold text-ink-soft">Not answered</span>
            </li>
          </ul>
          <p className="mt-5 rounded-full bg-primary py-2 text-center text-sm font-semibold text-surface">Mutual like</p>
        </div>
        <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-lift">
          <img src="/images/people/p11.jpg" alt="Illustrative portrait of a smiling man" className="h-full w-full object-cover object-top" />
        </div>
      </div>
      <figcaption className="mt-5 text-center text-xs text-ink-muted">Illustration with stock photography — not real members.</figcaption>
    </figure>
  );
}
