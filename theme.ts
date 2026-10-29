// "The Eternal Rose": Knot's single source of colour truth.
// Tailwind reads these through CSS custom properties (see tailwind.config.ts), so every
// value here is also available in CSS as --color-<name>.
// Gold is decorative only: it does not meet text contrast on parchment.
export const tokens = {
  background: "#F9F0E8",
  "background-deep": "#F6EBE1",
  surface: "#FFF9F5",
  primary: "#641E32",
  "primary-hover": "#7A2946",
  "primary-50": "#F8ECEC",
  "primary-100": "#F0DADC",
  "primary-200": "#DFB5BC",
  "primary-300": "#C48C97",
  "primary-700": "#521828",
  "primary-800": "#3E111E",
  accent: "#A83F55",
  rose: "#D9A0A7",
  "rose-soft": "#F5E3E2",
  "rose-mist": "#FBEFEC",
  gold: "#C6A15B",
  "gold-soft": "#F4E9D3",
  "gold-ink": "#6B5122",
  text: "#30232A",
  "text-soft": "#574650",
  "text-muted": "#79656D",
  border: "#E7D6D1",
  "border-strong": "#D6C0B9",
  success: "#42654A",
  "success-soft": "#E5ECE2",
  error: "#A52F45",
  "error-hover": "#8A2539",
  "error-soft": "#F8E3E5",
} as const;

export type Token = keyof typeof tokens;

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");

/** `--color-x: #hex` for direct CSS use, and `--rgb-x: r g b` so Tailwind opacity modifiers work. */
export const cssVariables = Object.fromEntries(
  Object.entries(tokens).flatMap(([k, v]) => [
    [`--color-${k}`, v],
    [`--rgb-${k}`, channels(v)],
  ]),
);
