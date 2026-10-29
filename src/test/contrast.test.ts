import { describe, expect, it } from "vitest";
import { tokens as t } from "../../theme";

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const ratio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Every text/background pairing used in the UI must meet WCAG AA for normal text (4.5:1).
const PAIRS: [string, string, string][] = [
  ["body text on parchment", t.text, t.background],
  ["secondary text on parchment", t["text-soft"], t.background],
  ["muted text on parchment", t["text-muted"], t.background],
  ["muted text on surface", t["text-muted"], t.surface],
  ["muted text on deep parchment", t["text-muted"], t["background-deep"]],
  ["burgundy links on parchment", t.primary, t.background],
  ["button text on burgundy", t.surface, t.primary],
  ["button text on burgundy hover", t.surface, t["primary-hover"]],
  ["accent text on parchment", t.accent, t.background],
  ["rose badge", t.accent, t["rose-soft"]],
  ["secondary text on rose prompt card", t["text-soft"], t["rose-soft"]],
  ["text on rose game deck", t["primary-800"], t.rose],
  ["text on accent game deck", t.surface, t.accent],
  ["gold badge", t["gold-ink"], t["gold-soft"]],
  ["gold headings on burgundy footer", t.gold, t.primary],
  ["badge text on gold", t["primary-800"], t.gold],
  ["burgundy-50 chip", t["primary-700"], t["primary-50"]],
  ["success badge", t.success, t["success-soft"]],
  ["success text on parchment", t.success, t.background],
  ["error text on parchment", t.error, t.background],
  ["error alert", t.error, t["error-soft"]],
  ["danger button", t.surface, t.error],
];

describe("colour contrast (WCAG AA)", () => {
  it.each(PAIRS)("%s meets 4.5:1", (_name, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it("keeps gold off light backgrounds as text (decorative only)", () => {
    expect(ratio(t.gold, t.background)).toBeLessThan(4.5);
  });
});
