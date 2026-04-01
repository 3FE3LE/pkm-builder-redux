import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.dirname(fileURLToPath(new URL(import.meta.url)));

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "lib/**/*.ts",
        "hooks/**/*.ts",
        "components/Builder*.tsx",
        "components/team/**/*.tsx",
        "components/ui/**/*.tsx",
      ],
      exclude: [
        "**/*.d.ts",
        "data/**",
        "scripts/**",
        "app/**",
        "lib/docs.ts",
        "lib/docsSchema.ts",
        "hooks/actionTypes.ts",
        "hooks/types.ts",
        "components/team/checkpoints/index.ts",
        "components/team/editor/Sections.tsx",
        "components/team/MoveHighlightsPanel.tsx",
      ],
      thresholds: {
        statements: 90,
        branches: 75,
        functions: 90,
        lines: 90,
      },
    },
  },
  resolve: {
    alias: {
      "@": rootDir,
    },
  },
});
