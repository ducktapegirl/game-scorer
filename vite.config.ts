/// <reference types="vitest/config" />
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  // Project site lives at https://ducktapegirl.github.io/game-scorer/, a
  // subpath — so production builds need that base. Dev stays at root.
  base: command === "build" ? "/game-scorer/" : "/",
  test: {
    globals: true,
    include: ["games/**/tests/**/*.test.ts", "core/**/*.test.ts"],
    environment: "node",
  },
}));
