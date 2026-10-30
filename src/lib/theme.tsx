import { useSyncExternalStore } from "react";
import { darkTokens, tokens } from "../../theme";

export type ThemeChoice = "system" | "light" | "dark";
const KEY = "knot:theme";

function read(): ThemeChoice {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark") return v;
  } catch {
    /* storage can be blocked; follow the system */
  }
  return "system";
}

let choice: ThemeChoice = typeof window === "undefined" ? "system" : read();
const listeners = new Set<() => void>();
const media = () => (typeof window !== "undefined" && window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null);
const resolved = (): "light" | "dark" => (choice === "system" ? (media()?.matches ? "dark" : "light") : choice);

function apply() {
  const theme = resolved();
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? darkTokens.background : tokens.background);
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  apply();
  media()?.addEventListener?.("change", () => {
    if (choice === "system") apply();
  });
}

export function setThemeChoice(next: ThemeChoice) {
  choice = next;
  try {
    if (next === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, next);
  } catch {
    /* still applies for this visit */
  }
  apply();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** The saved choice, the theme actually showing, and a setter. Stored per device. */
export function useTheme() {
  const value = useSyncExternalStore(subscribe, () => `${choice}:${resolved()}`);
  const [c, r] = value.split(":") as [ThemeChoice, "light" | "dark"];
  return { choice: c, theme: r, setChoice: setThemeChoice };
}
