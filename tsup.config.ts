import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  external: ["@opencode-ai/plugin"],
  target: "node18",
  outDir: "dist",
  sourcemap: true,
})
