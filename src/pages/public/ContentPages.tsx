import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ButtonLink } from "../../components/ui/Button";
import { Icon } from "../../components/ui/Icon";
import { INTENTIONS } from "../../lib/labels";

function PageIntro({ eyebrow, title, children }: { eyebrow: string; title: ReactNode; children?: ReactNode }) {
  return (
    <header className="container-page pb-12 pt-14 sm:pt-20">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-4 max-w-3xl text-5xl leading-[1.05] sm:text-6xl">{title}</h1>
      {children && <div className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">{children}</div>}
    </header>
  );
}

/** Legal drafts are labelled clearly; they must be reviewed by a lawyer before launch. */
function DraftNotice() {
  return (
    <div role="note" className="mb-10 flex gap-3 rounded-3xl border border-gold/50 bg-gold-soft/60 p-5 text-sm text-gold-ink">
      <Icon name="flag" className="mt-0.5 h-5 w-5 shrink-0" />
      <p>
        <strong>Draft for review.</strong> This page describes how Knot is designed to work. It has not yet been reviewed by legal counsel and is not a binding legal document. It will be replaced before public launch.
      </p>
    </div>
  );
}

function Prose({ children }: { children: ReactNode }) {
  return <div className="container-page"><div className="prose-knot max-w-3xl">{children}</div></div>;
}

export function HowItWorks() {
  const steps = [
    ["Create an account", "Sign up with your email, confirm you're 18 or over, and verify your address. Your date of birth stays private — others only see your age."],
    ["Say what you're looking for", "Pick one or more intentions: exploring, casual, or long-term. Choose who you'd like to meet and the age range and distance that suit you."],
    ["Answer what you like", "Optional compatibility questions cover communication, lifestyle and values. Skip any you want; skipped answers are never counted against you."],
    ["Preview, then publish", "See exactly how your profile looks to others before it goes live. Edit anything at any time."],
    ["Discover and like", "Browse profiles that fit both your preferences and theirs. A match only happens when you both like each other."],
    ["Talk and play", "Chat in real time and, if you like, play a curated question game together. Knot AI can suggest an opener — or stay out of the way."],
  ];
  return (
    <>
      <PageIntro eyebrow="How Knot works" title="A calmer way to meet people.">
        Knot is designed around honesty about intentions, readable compatibility, and conversations that go somewhere.
      </PageIntro>
      <section className="container-page">
        <ol className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {steps.map(([t, d], i) => (
            <li key={t} className="rounded-4xl border hairline bg-surface/70 p-7 shadow-soft">
              <span className="font-serif text-4xl text-accent">{String(i + 1).padStart(2, "0")}</span>
              <h2 className="mt-4 text-2xl">{t}</h2>
              <p className="mt-2 leading-relaxed text-ink-soft">{d}</p>
            </li>
          ))}
        </ol>
        <div className="mt-16 rounded-4xl bg-rose-mist p-8 sm:p-12">
          <h2 className="text-3xl">About compatibility scores</h2>
          <p className="mt-3 max-w-3xl leading-relaxed text-ink-soft">
            Scores compare only what both people chose to share: intentions, interests and optional answers, weighted by how important each person said a question is. We show what lines up, what differs, and what's missing. A score describes overlap in stated preferences; it can't predict whether a relationship will work, and we never use your photos or private messages to calculate it.
          </p>
        </div>
        <div className="mt-12 text-center">
          <ButtonLink to="/signup" size="lg">
            Get started
          </ButtonLink>
        </div>
      </section>
    </>
  );
}

export function Intentions() {
  return (
    <>
      <PageIntro eyebrow="Relationship intentions" title="Three honest starting points.">
        Your intention tells others what you're open to right now. You can choose more than one and change it whenever your life changes.
      </PageIntro>
      <section className="container-page space-y-6">
        {INTENTIONS.map((i, idx) => (
          <article key={i.value} id={i.value.toLowerCase()} className="scroll-mt-28 grid gap-6 rounded-4xl border hairline bg-surface/70 p-8 shadow-soft md:grid-cols-[14rem_1fr] md:p-10">
            <div>
              <span className={["inline-block rounded-full px-3 py-1 text-xs font-semibold", idx === 0 ? "bg-rose-soft text-accent" : idx === 1 ? "bg-gold-soft text-gold-ink" : "bg-primary-50 text-primary-700"].join(" ")}>{i.short}</span>
              <h2 className="mt-4 text-3xl">{i.title}</h2>
            </div>
            <div className="space-y-3 leading-relaxed text-ink-soft">
              <p>{i.description}</p>
              {i.value === "SINGLE" && <p>Good for people who are new to a city, newly single, or simply curious. There's no expectation to define things early.</p>}
              {i.value === "SITUATIONSHIP" && <p>Casual can still be kind. We ask everyone choosing this to be clear about boundaries and to respect people who want different things.</p>}
              {i.value === "MARRIAGE" && <p>For people ready to talk about values, family and the future. The optional compatibility questions are especially useful here.</p>}
            </div>
          </article>
        ))}
        <p className="pt-4 text-ink-soft">
          Intentions are preferences, not account types. Everyone has the same features and the same protections, whatever they choose.
        </p>
      </section>
    </>
  );
}

export function Safety() {
  const items = [
    ["Adults only", "Knot is for people aged 18 and over. Age is calculated on our servers from your date of birth, which is never shown to anyone. Reports of possible under-18 accounts are prioritised and the account is restricted while we review it."],
    ["Your location stays approximate", "We store your city or a rounded position (about 1 km) and show others only a distance range. We remove location data embedded in photos before storing them."],
    ["Blocking and reporting", "Block or report from any profile or message. Blocking ends the match, closes the conversation, and hides you from each other. Reports go to trained moderators; we don't tell the other person who reported them."],
    ["Your messages are yours", "Only you and your match can read your conversation. Moderators see a specific message only if one of you reports it. Experts and Knot AI never have access to chats."],
    ["Control your visibility", "Pause Discover, hide your profile from new people, turn off read receipts and typing indicators, or delete your account."],
    ["Secure by design", "Passwords are hashed with Argon2id, sessions use secure HTTP-only cookies, and sensitive actions are rate-limited and logged for audit."],
  ];
  return (
    <>
      <PageIntro eyebrow="Safety & privacy" title="Your safety isn't a feature. It's the foundation.">
        Here's what Knot does to protect you, and what you can do to stay in control.
      </PageIntro>
      <section className="container-page grid gap-5 md:grid-cols-2">
        {items.map(([t, d]) => (
          <div key={t} className="rounded-4xl border hairline bg-surface/70 p-7 shadow-soft">
            <Icon name="shield" className="h-6 w-6 text-primary" />
            <h2 className="mt-4 text-2xl">{t}</h2>
            <p className="mt-2 leading-relaxed text-ink-soft">{d}</p>
          </div>
        ))}
      </section>
      <section className="container-page mt-14">
        <div className="rounded-4xl border hairline bg-surface p-8 sm:p-10">
          <h2 className="text-3xl">Meeting in person</h2>
          <ul className="mt-4 grid gap-3 text-ink-soft sm:grid-cols-2">
            {["Meet somewhere public for the first few dates.", "Tell a friend where you're going and when.", "Arrange your own transport.", "Never send money to someone you haven't met.", "Trust your instincts — it's okay to leave.", "Report anyone who makes you feel unsafe."].map((t) => (
              <li key={t} className="flex gap-2">
                <Icon name="check" className="mt-0.5 h-5 w-5 shrink-0 text-success" /> {t}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-ink-soft">If you are in immediate danger, contact local emergency services (112 in India).</p>
        </div>
      </section>
    </>
  );
}

export function About() {
  return (
    <>
      <PageIntro eyebrow="About Knot" title="We think dating should feel less like a slot machine.">
        Knot is built for people who want to be clear about what they're looking for and kind about how they look for it.
      </PageIntro>
      <section className="container-page grid gap-10 md:grid-cols-2 md:items-center">
        <img src="/images/friends.jpg" alt="Friends with arms around each other watching a sunset on a hillside" className="aspect-[4/3] w-full rounded-4xl object-cover shadow-lift" loading="lazy" />
        <div className="space-y-4 text-lg leading-relaxed text-ink-soft">
          <p>Most dating apps are optimised for time spent in the app. We'd rather optimise for good first conversations — and for people leaving Knot because it worked.</p>
          <p>That's why we don't show inflated match counts, invent likes, or use urgency to keep you scrolling. What you see is real.</p>
          <p>Knot is an early-stage product. We're building carefully, listening to members, and publishing how our features work — including how compatibility is calculated.</p>
        </div>
      </section>
      <section className="container-page mt-16 grid gap-5 sm:grid-cols-3">
        {[
          ["Honest", "Real likes, real matches, no deceptive urgency."],
          ["Respectful", "Every intention is valid. Every boundary matters."],
          ["Transparent", "Readable compatibility and clearly labelled AI."],
        ].map(([t, d]) => (
          <div key={t} className="rounded-4xl bg-rose-mist p-7">
            <h2 className="text-2xl">{t}</h2>
            <p className="mt-2 text-ink-soft">{d}</p>
          </div>
        ))}
      </section>
    </>
  );
}

export function Guidelines() {
  return (
    <>
      <PageIntro eyebrow="Community guidelines" title="How we treat each other on Knot." />
      <Prose>
        <p>Knot works when people feel safe being honest. These guidelines apply to profiles, photos, messages, games and anything else you share.</p>
        <h2>Be yourself — truthfully</h2>
        <ul>
          <li>Use your own recent photos and your real age. You must be 18 or over.</li>
          <li>Be honest about your intentions. Update them when they change.</li>
          <li>Don't impersonate anyone or create more than one account.</li>
        </ul>
        <h2>Be respectful</h2>
        <ul>
          <li>No harassment, threats, hate speech or discrimination based on identity, religion, caste, ethnicity, gender, sexuality or disability.</li>
          <li>Consent matters in conversation too. Don't send sexual content to anyone who hasn't clearly asked for it.</li>
          <li>“No” and silence are answers. Don't pressure people who have unmatched or stopped replying.</li>
        </ul>
        <h2>Keep it safe</h2>
        <ul>
          <li>No requests for money, investment pitches, or promotion of other services.</li>
          <li>Don't share anyone else's private information.</li>
          <li>Nothing illegal, including any content involving minors.</li>
        </ul>
        <h2>Suspected under-18 accounts</h2>
        <p>If you think someone may be under 18, report them and choose “May be under 18”. These reports are reviewed first. The account is restricted while we review it and removed if we can't confirm the person is an adult.</p>
        <h2>What happens when guidelines are broken</h2>
        <p>Depending on severity, we may remove content, restrict features, suspend or permanently close accounts, and, where required, cooperate with law enforcement. Moderation decisions are logged and reviewed.</p>
      </Prose>
    </>
  );
}

export function Terms() {
  return (
    <>
      <PageIntro eyebrow="Terms of service" title="Terms of service" />
      <Prose>
        <DraftNotice />
        <h2>Who can use Knot</h2>
        <p>You must be at least 18 years old and able to form a binding agreement. You're responsible for keeping your login details secure.</p>
        <h2>Your content</h2>
        <p>You keep ownership of what you post. You give Knot permission to store and display it to other members as needed to run the service. You confirm you have the right to share any photos you upload.</p>
        <h2>Acceptable use</h2>
        <p>You agree to follow the <Link className="text-primary underline" to="/guidelines">community guidelines</Link>. We may restrict or close accounts that break them.</p>
        <h2>Compatibility, experts and AI</h2>
        <p>Compatibility scores, expert reviews and AI suggestions are informational only. They do not predict relationship outcomes and are not professional, medical, psychological or legal advice.</p>
        <h2>Ending your account</h2>
        <p>You can delete your account in Settings at any time. Deleted accounts are hidden immediately and permanently removed after a 30-day grace period.</p>
        <h2>Changes</h2>
        <p>We'll tell you about material changes to these terms before they take effect.</p>
      </Prose>
    </>
  );
}

export function Privacy() {
  return (
    <>
      <PageIntro eyebrow="Privacy policy" title="Privacy policy" />
      <Prose>
        <DraftNotice />
        <h2>What we collect</h2>
        <ul>
          <li>Account details: email, password (stored only as a secure hash), date of birth.</li>
          <li>Profile details you choose to add: name, photos, bio, gender, interests, languages, city, intentions, preferences.</li>
          <li>Optional compatibility answers, which are never shown to other members.</li>
          <li>Activity needed to run the service: likes, matches, messages, reports, and basic security logs.</li>
        </ul>
        <h2>What others can see</h2>
        <p>Your display name, age (not date of birth), photos, bio, interests, languages, city, intentions, and an approximate distance range. Never your email, exact location, or individual compatibility answers.</p>
        <h2>How we use it</h2>
        <p>To show you relevant people, calculate compatibility from information you've chosen to share, deliver messages, keep members safe, and improve Knot. We don't sell personal data.</p>
        <h2>AI features</h2>
        <p>Knot AI is optional. When used, only the minimum context needed (such as shared interests) is sent to the AI provider. Private chat histories are never sent. We record usage counts and timing, not the text.</p>
        <h2>Experts</h2>
        <p>An expert only sees the specific information you tick when you request a review, captured at that moment. Experts can never access your messages.</p>
        <h2>Your choices</h2>
        <p>You can edit or remove profile information, download a copy of your data, turn off AI, pause Discover, and delete your account in Settings.</p>
        <h2>Retention</h2>
        <p>Deleted accounts are permanently removed after 30 days. Some records (such as moderation audit logs) are kept longer where needed for safety or legal reasons.</p>
      </Prose>
    </>
  );
}

export function Contact() {
  return (
    <>
      <PageIntro eyebrow="Contact & support" title="We're here to help.">
        For the fastest help with someone's behaviour, use Report on their profile or message — it goes straight to our moderation queue.
      </PageIntro>
      <section className="container-page grid gap-5 md:grid-cols-3">
        {[
          ["Account & technical help", "support@knot.example", "Login problems, verification emails, bugs."],
          ["Safety concerns", "safety@knot.example", "Anything that made you feel unsafe on or off Knot."],
          ["Privacy requests", "privacy@knot.example", "Questions about your data or this policy."],
        ].map(([t, email, d]) => (
          <div key={t} className="rounded-4xl border hairline bg-surface/70 p-7 shadow-soft">
            <h2 className="text-2xl">{t}</h2>
            <p className="mt-2 text-ink-soft">{d}</p>
            <a href={`mailto:${email}`} className="mt-5 inline-flex items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline">
              {email}
            </a>
          </div>
        ))}
      </section>
      <p className="container-page mt-6 text-sm text-ink-muted">These addresses are placeholders for this preview build and will be replaced with monitored inboxes before launch.</p>
      <section className="container-page mt-14">
        <h2 className="text-3xl">Common questions</h2>
        <dl className="mt-6 divide-y hairline rounded-4xl border hairline bg-surface/60">
          {[
            ["I didn't get my verification email.", "Check spam, then use “Resend email” on the verification screen. Links expire after 24 hours."],
            ["How do I hide my profile?", "Settings → Visibility. Pausing Discover keeps your matches and conversations."],
            ["Can I undo deleting my account?", "Contact support within 30 days of deleting and we can restore it."],
            ["Why can't I see someone anymore?", "They may have paused, unmatched, or blocked — we don't say which, to protect everyone's privacy."],
          ].map(([q, a]) => (
            <div key={q} className="p-6">
              <dt className="font-semibold">{q}</dt>
              <dd className="mt-1 text-ink-soft">{a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}

export function NotFound() {
  return (
    <div className="container-page flex flex-col items-center py-28 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-4 text-5xl">This thread came loose.</h1>
      <p className="mt-4 max-w-md text-ink-soft">The page you're looking for doesn't exist or has moved.</p>
      <ButtonLink to="/" className="mt-8">
        Back to Knot
      </ButtonLink>
    </div>
  );
}
