import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    tsconfigPaths: true, // honour the "@/*" alias from tsconfig.json
    alias: {
      // The real "server-only" package throws if imported outside a Next.js server build.
      // In unit tests we are on the server, so swap in an empty module.
      "server-only": path.resolve(import.meta.dirname, "tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    setupFiles: ["tests/setup.ts"],
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: { provider: "v8", include: ["src/server/**", "src/shared/**"] },
  },
});
