import type { IconName } from "../../../components/ui/Icon";

// Visual identity per deck. Content comes from the database; this is presentation only.
export const DECK_STYLE: Record<string, { surface: string; ink: string; icon: IconName; mood: string }> = {
  RED_FLAG_GREEN_FLAG: { surface: "bg-rose", ink: "text-rose-ink", icon: "flag", mood: "Quick calls" },
  KNOW_EACH_OTHER: { surface: "bg-lavender", ink: "text-plum-700", icon: "matches", mood: "Guess & tell" },
  DEEP_QUESTIONS: { surface: "bg-plum", ink: "text-ivory", icon: "spark", mood: "Slow & thoughtful" },
  WOULD_YOU_RATHER: { surface: "bg-sage", ink: "text-sage-ink", icon: "games", mood: "Playful" },
  LOYALTY_BOUNDARIES: { surface: "bg-gold-soft", ink: "text-gold-ink", icon: "shield", mood: "Honest talk" },
  LOVE_LANGUAGES: { surface: "bg-rose-soft", ink: "text-rose-ink", icon: "heart", mood: "Care & connection" },
  FUN_CHALLENGES: { surface: "bg-sage-deep", ink: "text-sage-ink", icon: "stack", mood: "Light & silly" },
};

export const deckStyle = (category: string) => DECK_STYLE[category] ?? DECK_STYLE.WOULD_YOU_RATHER;
