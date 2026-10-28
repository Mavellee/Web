import { describe, expect, it } from "vitest";
import config from "../../tailwind.config";

const c = config.theme!.extend!.colors as Record<string, Record<string, string>>;

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
  ["body text on ivory", c.ink.DEFAULT, c.ivory.DEFAULT],
  ["secondary text on ivory", c.ink.soft, c.ivory.DEFAULT],
  ["muted text on ivory", c.ink.muted, c.ivory.DEFAULT],
  ["plum links on ivory", c.plum.DEFAULT, c.ivory.DEFAULT],
  ["button text on plum", c.ivory.DEFAULT, c.plum.DEFAULT],
  ["sage badge", c.sage.ink, c.sage.DEFAULT],
  ["rose badge / errors", c.rose.ink, c.rose.soft],
  ["gold badge", c.gold.ink, c.gold.soft],
  ["lavender badge", c.plum[700], c.lavender.soft],
  ["plum-50 chip", c.plum[700], c.plum[50]],
];

describe("colour contrast (WCAG AA)", () => {
  it.each(PAIRS)("%s meets 4.5:1", (_name, fg, bg) => {
    expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
