import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    isolate: false,
    coverage: {
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
    },
  },
});
