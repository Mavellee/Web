import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { QueryProvider } from "@/lib/query-provider";
import "./globals.css";

const sans = Inter({ variable: "--font-sans-var", subsets: ["latin"] });
const serif = Playfair_Display({ variable: "--font-serif-var", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Iceberg – deeper conversations, real connections", template: "%s · Iceberg" },
  description:
    "More than a match, a meaningful connection. Intent-based matching, astrologer-reviewed compatibility and an AI companion that keeps conversations going.",
};

export const viewport: Viewport = {
  themeColor: "#8f4a68",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
