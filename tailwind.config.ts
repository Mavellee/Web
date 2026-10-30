import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import { cssVariables, darkCssVariables, type Token } from "./theme";

// The Eternal Rose palette. Values live in theme.ts and reach the page as CSS variables.
const v = (t: Token) => `rgb(var(--rgb-${t}) / <alpha-value>)`;

// Foreground uses of the brand colours resolve to a lifted shade in dark mode; backgrounds stay deep burgundy.
const brandForeground = {
  primary: { DEFAULT: v("primary-text"), 700: v("primary-700-text"), 800: v("primary-800-text") },
  accent: v("accent-text"),
};

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        parchment: { DEFAULT: v("background"), deep: v("background-deep") },
        surface: v("surface"),
        primary: {
          50: v("primary-50"),
          100: v("primary-100"),
          200: v("primary-200"),
          300: v("primary-300"),
          DEFAULT: v("primary"),
          hover: v("primary-hover"),
          700: v("primary-700"),
          800: v("primary-800"),
        },
        accent: v("accent"),
        rose: { DEFAULT: v("rose"), soft: v("rose-soft"), mist: v("rose-mist") },
        gold: { DEFAULT: v("gold"), soft: v("gold-soft"), ink: v("gold-ink") },
        ink: { DEFAULT: v("text"), soft: v("text-soft"), muted: v("text-muted") },
        line: { DEFAULT: v("border"), strong: v("border-strong") },
        success: { DEFAULT: v("success"), soft: v("success-soft") },
        error: { DEFAULT: v("error"), hover: v("error-hover"), soft: v("error-soft") },
        paper: v("paper"),
        scrim: v("scrim"),
        brand: v("brand"),
        panel: v("panel"),
      },
      // text-surface always sits on burgundy or a photo, so it stays cream in both themes.
      textColor: { ...brandForeground, surface: v("paper"), error: { DEFAULT: v("error-text"), hover: v("error-text"), soft: v("error-soft") } },
      borderColor: { ...brandForeground, DEFAULT: v("border") },
      ringColor: brandForeground,
      stroke: brandForeground,
      fill: brandForeground,
      fontFamily: {
        serif: ['"Fraunces Variable"', "Georgia", "serif"],
        sans: ['"Manrope Variable"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(48,35,42,0.04), 0 8px 24px -12px rgba(48,35,42,0.12)",
        lift: "0 2px 4px rgba(48,35,42,0.05), 0 18px 40px -18px rgba(100,30,50,0.32)",
      },
      borderRadius: { "4xl": "2rem" },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: { rise: "rise 400ms cubic-bezier(.2,.7,.2,1) both" },
    },
  },
  plugins: [plugin(({ addBase }) => addBase({ ":root": cssVariables, '[data-theme="dark"]': darkCssVariables }))],
} satisfies Config;
