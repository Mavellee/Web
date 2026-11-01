import Link from "next/link";
import { Gamepad2, GraduationCap, HeartHandshake, Sparkles, Bot } from "lucide-react";
import { IcebergMark, Wordmark } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: HeartHandshake,
    title: "Intent-based matching",
    body: "Single, situationship or open to explore. We show you people who want the same thing.",
  },
  {
    icon: Sparkles,
    title: "Astrology + human review",
    body: "Opt in and a real astrologer reviews your match before you chat.",
  },
  {
    icon: Bot,
    title: "Iceberg, your AI companion",
    body: "Thoughtful questions and deeper talks so conversations never go dry.",
  },
  {
    icon: Gamepad2,
    title: "Play and connect",
    body: "Little games that help you know each other better.",
  },
  {
    icon: GraduationCap,
    title: "Campus events",
    body: "Meet, socialise and build real connections offline too.",
  },
];

// Static page: no cookies/headers read, so it is prerendered into the static shell.
export default function Home() {
  return (
    <main className="bg-blush flex min-h-screen flex-col">
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-12 lg:grid-cols-2 lg:py-20">
        <section className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <IcebergMark className="size-28 lg:size-32" />
          <h1 className="mt-4">
            <Wordmark className="text-5xl lg:text-6xl" />
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Deeper conversations. Real connections.
          </p>
          <p className="mt-6 max-w-md text-balance text-muted-foreground">
            More than a match, a meaningful connection. Built for people who would rather talk about
            something real than swipe forever.
          </p>

          <div className="mt-8 flex w-full max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row">
            <Link href="/sign-up" className={cn(buttonVariants({ size: "xl" }), "sm:min-w-48")}>
              Create account
            </Link>
            <Link
              href="/sign-in"
              className={cn(buttonVariants({ variant: "outline", size: "xl" }), "sm:min-w-48")}
            >
              I already have an account
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">18+ only. Your photos and details stay private.</p>
        </section>

        <section aria-label="What makes Iceberg different">
          <ul className="grid gap-4 sm:grid-cols-2">
            {features.map(({ icon: Icon, title, body }) => (
              <li key={title} className="rounded-2xl border bg-card/80 p-5 shadow-sm backdrop-blur">
                <span className="flex size-10 items-center justify-center rounded-full bg-accent text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h2 className="mt-3 font-semibold">{title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
