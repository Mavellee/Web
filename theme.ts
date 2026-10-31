// "The Eternal Rose": Mavelle's single source of colour truth.
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
  // Text and lines in the brand colours. Burgundy can't be read on a dark page, so these lift in dark mode.
  "primary-text": "#641E32",
  "primary-700-text": "#521828",
  "primary-800-text": "#3E111E",
  "accent-text": "#A83F55",
  "error-text": "#A52F45",
  // The same in both themes: text on burgundy or photos, photo scrims, and the doodle paper.
  paper: "#FFF9F5",
  scrim: "#1C1216",
  brand: "#641E32",
  // Sidebar and footer: full burgundy in light, quieter in dark so it does not overpower the page.
  panel: "#641E32",
} as const;

export type Token = keyof typeof tokens;

/** Warm aubergine rather than grey, so dark mode still feels like Mavelle. */
export const darkTokens: Record<Token, string> = {
  ...tokens,
  background: "#1A1216",
  "background-deep": "#140D11",
  surface: "#261B21",
  primary: "#8A2C48",
  "primary-hover": "#9E3654",
  "primary-50": "#2F1B22",
  "primary-100": "#3B212A",
  "primary-200": "#5A2F3C",
  "primary-300": "#B9808D",
  "primary-700": "#6B2139",
  "primary-800": "#4A1626",
  accent: "#B84D64",
  rose: "#5B2F3A",
  "rose-soft": "#352026",
  "rose-mist": "#25161B",
  "gold-soft": "#33291A",
  "gold-ink": "#E3C98F",
  text: "#F5EAE6",
  "text-soft": "#D3C2C3",
  "text-muted": "#AC9A9F",
  border: "#3B2D33",
  "border-strong": "#524047",
  success: "#8FB796",
  "success-soft": "#1F2D23",
  error: "#C2475F",
  "error-hover": "#A83A50",
  "error-soft": "#3A1C24",
  panel: "#3A1522",
  "primary-text": "#E7A9B3",
  "primary-700-text": "#E7A9B3",
  "primary-800-text": "#F0C4CB",
  "accent-text": "#EC97A6",
  "error-text": "#F09AA8",
};

const channels = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(" ");

const variables = (values: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(values).flatMap(([k, v]) => [
      [`--color-${k}`, v],
      [`--rgb-${k}`, channels(v)],
    ]),
  );

/** `--color-x: #hex` for direct CSS use, and `--rgb-x: r g b` so Tailwind opacity modifiers work. */
export const cssVariables = { ...variables(tokens), "--sheen": "rgb(255 255 255 / 0.6)", "color-scheme": "light" };
export const darkCssVariables = { ...variables(darkTokens), "--sheen": "rgb(255 255 255 / 0.04)", "color-scheme": "dark" };
