// Small hand-tuned line icon set (24px grid, 1.7 stroke) so we don't ship an icon library.
const paths: Record<string, string> = {
  discover: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm3.5-12.5-2 5-5 2 2-5 5-2Z",
  heart: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
  matches: "M8.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7 0a3.5 3.5 0 1 0 0-7M2.5 20c.6-3.4 3.1-5.5 6-5.5s5.4 2.1 6 5.5m1-5.4c2.4.3 4.5 2.2 5 5.4",
  chat: "M20 12a8 8 0 0 1-11.6 7.1L4 20l.9-4.4A8 8 0 1 1 20 12Z",
  compass: "M4 12h4m8 0h4M12 4v4m0 8v4m6.4-12.4-2.8 2.8m-7.2 7.2-2.8 2.8m0-12.8 2.8 2.8m7.2 7.2 2.8 2.8",
  spark: "M12 3v4m0 10v4M3 12h4m10 0h4M6 6l2.5 2.5m7 7L18 18M6 18l2.5-2.5m7-7L18 6",
  games: "M7 8h10a4 4 0 0 1 4 4v2a3 3 0 0 1-5.4 1.8L14.5 14h-5l-1.1 1.8A3 3 0 0 1 3 14v-2a4 4 0 0 1 4-4Zm1 2.5v3M6.5 12h3M16 11.5h.01M18 13h.01",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 9c.8-3.8 3.8-6 7.5-6s6.7 2.2 7.5 6",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a7.4 7.4 0 0 0-.1-1.2l2-1.6-2-3.4-2.4.9a7.5 7.5 0 0 0-2-1.2L14.5 3h-5l-.4 2.5a7.5 7.5 0 0 0-2 1.2l-2.4-.9-2 3.4 2 1.6a7.4 7.4 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-.9a7.5 7.5 0 0 0 2 1.2l.4 2.5h5l.4-2.5a7.5 7.5 0 0 0 2-1.2l2.4.9 2-3.4-2-1.6c.1-.4.1-.8.1-1.2Z",
  bell: "M18 16V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2Zm-8 4a2 2 0 0 0 4 0",
  shield: "M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Zm-3 9 2 2 4-4",
  expert: "M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 15.6 7.1 18.2 8 12.7 4 8.8 9.5 8 12 3Z",
  close: "M6 6l12 12M18 6 6 18",
  check: "M5 12.5l4.5 4.5L19 7",
  back: "M15 5l-7 7 7 7",
  send: "M4 12 20 4l-4 16-4-7-8-1Zm8 1 8-9",
  image: "M4 5h16v14H4zM4 15l5-5 4 4 3-3 4 4M15.5 9.5h.01",
  flag: "M5 21V4m0 0h11l-2 4 2 4H5",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  plus: "M12 5v14M5 12h14",
  location: "M12 21s-6.5-6.2-6.5-11A6.5 6.5 0 0 1 18.5 10c0 4.8-6.5 11-6.5 11Zm0-8.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
  logout: "M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 16l-4-4 4-4M6 12h10",
  admin: "M4 20V10m5 10V4m5 16v-7m5 7V8",
  arrow: "M5 12h14m-6-6 6 6-6 6",
  undo: "M9 14 4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3",
  menu: "M4 7h16M4 12h16M4 17h10",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12v9H6z",
  eye: "M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
  filter: "M4 6h16M7 12h10M10 18h4",
  sliders: "M4 7h9m4 0h3M4 17h3m4 0h9M15 4v6M9 14v6",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  stack: "M12 3 3 8l9 5 9-5-9-5Zm-9 9 9 5 9-5M3 16l9 5 9-5",
  edit: "M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4",
  chevronLeft: "M15 5l-7 7 7 7",
  chevronRight: "M9 5l7 7-7 7",
};

export type IconName = keyof typeof paths;

export function Icon({ name, className = "h-5 w-5", filled }: { name: IconName; className?: string; filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d={paths[name]} />
    </svg>
  );
}
