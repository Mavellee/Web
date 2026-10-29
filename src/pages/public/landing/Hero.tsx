import { ButtonLink } from "../../../components/ui/Button";
import { Icon } from "../../../components/ui/Icon";

export function Hero() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="container-page grid items-center gap-14 pb-20 pt-10 sm:pt-14 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:pb-28 lg:pt-20">
        <div className="max-w-xl animate-rise">
          <p className="eyebrow">Intentional dating for adults · 18+</p>
          <h1 id="hero-title" className="mt-6 text-[2.6rem] leading-[1.04] sm:text-[3.4rem] lg:text-[3.75rem]">
            Not just a match.
            <span className="block italic text-plum">A connection that makes sense.</span>
          </h1>
          <p className="mt-7 text-lg leading-relaxed text-ink-soft">
            Knot begins with what you're looking for — something open, something undefined, or something for life — and shows you why someone might fit, using only what you both chose to share.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <ButtonLink to="/signup" size="lg">
              Find your connection
            </ButtonLink>
            <ButtonLink to="/how-it-works" size="lg" variant="secondary">
              Discover how Knot works
            </ButtonLink>
          </div>
          <dl className="mt-12 grid max-w-md gap-5 sm:grid-cols-3 sm:gap-6 border-t hairline pt-6 text-sm">
            {[
              ["Mutual", "Matches only when you both say yes"],
              ["Private", "Exact location and birth date never shown"],
              ["Optional", "AI and experts, only if you want them"],
            ].map(([t, d]) => (
              <div key={t}>
                <dt className="font-serif text-lg text-ink">{t}</dt>
                <dd className="mt-1 leading-snug text-ink-muted">{d}</dd>
              </div>
            ))}
          </dl>
        </div>
        <HeroComposition />
      </div>
    </section>
  );
}

function HeroComposition() {
  return (
    <figure className="relative mx-auto aspect-[5/6] w-full max-w-[34rem] animate-rise [animation-delay:120ms]">
      {/* Main portrait */}
      <div className="absolute left-0 top-[6%] h-[78%] w-[60%] overflow-hidden rounded-[2rem] shadow-lift">
        <img src="/images/people/p13.jpg" alt="Illustrative portrait of a woman in a patterned collar" className="h-full w-full object-cover object-top" fetchPriority="high" />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-4 pt-16 text-ivory">
          <p className="font-serif text-xl">Amara, 29</p>
          <p className="text-xs text-ivory/80">Data scientist · Bengaluru</p>
        </div>
      </div>
      {/* Secondary portrait, offset */}
      <div className="absolute right-0 top-0 h-[46%] w-[40%] overflow-hidden rounded-[1.75rem] border-4 border-ivory shadow-lift">
        <img src="/images/people/p11.jpg" alt="Illustrative portrait of a smiling man" className="h-full w-full object-cover object-top" />
      </div>
      {/* Compatibility note: what Knot actually shows, in miniature */}
      <div className="absolute bottom-[4%] right-0 w-[62%] rounded-3xl border hairline bg-ivory p-5 shadow-lift sm:right-[2%]">
        <div className="flex items-center justify-between">
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-muted">Why you might connect</p>
          <Icon name="spark" className="h-4 w-4 text-gold" />
        </div>
        <ul className="mt-3 space-y-2 text-sm">
          <li className="flex items-center justify-between gap-3">
            <span>Long-term commitment</span>
            <span className="rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-sage-ink">Both</span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>How you handle conflict</span>
            <span className="rounded-full bg-sage px-2 py-0.5 text-xs font-semibold text-sage-ink">Aligned</span>
          </li>
          <li className="flex items-center justify-between gap-3">
            <span>Weekends</span>
            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs font-semibold text-ink-soft">Not answered</span>
          </li>
        </ul>
      </div>
      {/* Intention chip */}
      <div className="absolute right-[6%] top-[50%] hidden rounded-full bg-plum px-4 py-2 text-sm font-semibold text-ivory shadow-lift sm:block">
        Mutual like
      </div>
      <figcaption className="absolute -bottom-8 left-0 text-xs text-ink-muted">Illustration with stock photography — not real members.</figcaption>
    </figure>
  );
}
