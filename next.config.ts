import type { NextConfig } from "next";

/**
 * Baseline security headers for every response. Content-Security-Policy is added in Milestone 1
 * (it needs the exact Supabase / PostHog / Sentry hosts, and nonces for inline scripts).
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  // Camera/mic are requested later (voice intro); geolocation is used for "near you".
  { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(self)" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
