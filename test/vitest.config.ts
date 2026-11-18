import { defineConfig, configDefaults } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  resolve: {
    conditions: ["browser", "development", "default"],
    alias: {
      "lit/decorators": "lit/decorators.js",
    },
  },
  plugins: [tsconfigPaths()],
  test: {
    exclude: [...configDefaults.exclude, "test/e2e/**"],
    environment: "jsdom",
    env: {
      TZ: "Etc/UTC",
      IS_TEST: "true",
    },
    setupFiles: ["./test/setup.ts"],
    coverage: {
      include: [
        "src/data/**/*",
        "src/common/**/*",
        "src/external_app/**/*",
        "src/panels/**/*",
        "src/util/**/*",
      ],
      reporter: ["text", "html"],
      provider: "v8",
      reportsDirectory: "test/coverage",
    },
  },
});
