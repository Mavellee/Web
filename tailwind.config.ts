import type { Config } from "tailwindcss";

// Knot palette. Gold is decorative only (it does not meet text contrast on ivory).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ivory: { DEFAULT: "#FFF8F2", deep: "#F7EDE3" },
        sage: { DEFAULT: "#DDE8D8", deep: "#C5D6BE", ink: "#3F5A3A" },
        lavender: { DEFAULT: "#E0CEFA", soft: "#F1E8FD" },
        rose: { DEFAULT: "#F5D6DC", soft: "#FBEBEE", ink: "#8E3B4E" },
        plum: { 50: "#F6EFF4", 100: "#EBDCE6", 200: "#D5B8CB", 300: "#B48FA9", 400: "#93698A", DEFAULT: "#76506F", 600: "#62425C", 700: "#4E3549", 800: "#3B2837" },
        gold: { DEFAULT: "#D4A574", soft: "#F1E1CD", ink: "#7A5527" },
        ink: { DEFAULT: "#302832", soft: "#5C5160", muted: "#7A6F7D" },
      },
      fontFamily: {
        serif: ['"Fraunces Variable"', "Georgia", "serif"],
        sans: ['"Manrope Variable"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(48,40,50,0.04), 0 8px 24px -12px rgba(48,40,50,0.12)",
        lift: "0 2px 4px rgba(48,40,50,0.05), 0 18px 40px -18px rgba(118,80,111,0.30)",
      },
      borderRadius: { "4xl": "2rem" },
      keyframes: {
        rise: { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "none" } },
        shimmer: { "100%": { transform: "translateX(100%)" } },
      },
      animation: { rise: "rise 400ms cubic-bezier(.2,.7,.2,1) both" },
    },
  },
  plugins: [],
} satisfies Config;
