import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts", "catalog/**/*.test.ts"],
    environment: "node",
  },
});
