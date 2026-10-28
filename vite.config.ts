/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const api = process.env.KNOT_API_URL ?? "http://localhost:4000";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    strictPort: true,
    // Same-origin in development so the session cookie and CSRF origin check just work.
    proxy: {
      "/api": { target: api, changeOrigin: false },
      "/socket.io": { target: api, ws: true, changeOrigin: false },
    },
  },
  build: { sourcemap: false, target: "es2022" },
  test: {
    environment: "jsdom",
    setupFiles: ["src/test/setup.ts"],
    css: false,
  },
});
