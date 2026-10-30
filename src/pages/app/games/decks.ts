import type { IconName } from "../../../components/ui/Icon";

// Visual identity per deck. Content comes from the database; this is presentation only.
export const DECK_STYLE: Record<string, { surface: string; ink: string; icon: IconName; mood: string }> = {
  RED_FLAG_GREEN_FLAG: { surface: "bg-rose-soft", ink: "text-accent", icon: "flag", mood: "Quick calls" },
  KNOW_EACH_OTHER: { surface: "bg-primary-50", ink: "text-primary-700", icon: "matches", mood: "Guess & tell" },
  DEEP_QUESTIONS: { surface: "bg-primary", ink: "text-surface", icon: "spark", mood: "Slow & thoughtful" },
  WOULD_YOU_RATHER: { surface: "bg-rose", ink: "text-primary-800", icon: "games", mood: "Playful" },
  LOYALTY_BOUNDARIES: { surface: "bg-gold-soft", ink: "text-gold-ink", icon: "shield", mood: "Honest talk" },
  LOVE_LANGUAGES: { surface: "bg-accent", ink: "text-surface", icon: "heart", mood: "Care & connection" },
  FUN_CHALLENGES: { surface: "bg-parchment-deep", ink: "text-primary-700", icon: "stack", mood: "Light & silly" },
  COUPLE_KNOW_ME: { surface: "bg-primary-50", ink: "text-primary-700", icon: "heart", mood: "Guess & tell" },
  COUPLE_THIS_OR_THAT: { surface: "bg-rose", ink: "text-primary-800", icon: "games", mood: "Playful" },
  COUPLE_OUR_FIRSTS: { surface: "bg-gold-soft", ink: "text-gold-ink", icon: "star", mood: "Remember when" },
};

export const deckStyle = (category: string) => DECK_STYLE[category] ?? DECK_STYLE.WOULD_YOU_RATHER;
