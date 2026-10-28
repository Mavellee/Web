import type { Gender, Intention } from "./types";

export const INTENTIONS: { value: Intention; title: string; short: string; description: string }[] = [
  {
    value: "SINGLE",
    title: "Single & exploring",
    short: "Exploring",
    description: "Open to meeting people and seeing where things go, without a fixed destination.",
  },
  {
    value: "SITUATIONSHIP",
    title: "Casual or undefined",
    short: "Casual",
    description: "Something lighter or not yet labelled, with honesty about what it is and isn't.",
  },
  {
    value: "MARRIAGE",
    title: "Long-term commitment",
    short: "Long-term",
    description: "Looking for a committed partnership that could lead to marriage or a life together.",
  },
];
export const intentionLabel = (i: Intention) => INTENTIONS.find((x) => x.value === i)?.short ?? i;

export const GENDERS: { value: Gender; label: string }[] = [
  { value: "WOMAN", label: "Woman" },
  { value: "MAN", label: "Man" },
  { value: "NON_BINARY", label: "Non-binary" },
  { value: "TRANSGENDER_WOMAN", label: "Trans woman" },
  { value: "TRANSGENDER_MAN", label: "Trans man" },
  { value: "GENDERQUEER", label: "Genderqueer" },
  { value: "OTHER", label: "Another identity" },
];
export const genderLabel = (g: Gender) => GENDERS.find((x) => x.value === g)?.label ?? g;

export const DIMENSION_LABEL: Record<string, string> = {
  RELATIONSHIP_GOALS: "Relationship goals",
  COMMUNICATION: "Communication",
  LIFESTYLE: "Lifestyle",
  INTERESTS: "Interests",
  VALUES: "Long-term values",
};

export const CONFIDENCE_LABEL: Record<string, string> = {
  not_enough_information: "Not enough shared answers yet",
  limited: "Based on a few answers",
  moderate: "Based on several answers",
  good: "Based on many answers",
};

export const REPORT_REASONS = [
  { value: "HARASSMENT", label: "Harassment or bullying" },
  { value: "FAKE_PROFILE", label: "Fake profile or impersonation" },
  { value: "SCAM", label: "Scam, spam or asking for money" },
  { value: "UNDERAGE", label: "May be under 18" },
  { value: "INAPPROPRIATE_CONTENT", label: "Inappropriate photos or content" },
  { value: "HATE", label: "Hate speech or discrimination" },
  { value: "THREAT", label: "Threats or safety concern" },
  { value: "OTHER", label: "Something else" },
] as const;
