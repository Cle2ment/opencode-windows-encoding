import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/utf8-encoding.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  target: "node18",
  outDir: "dist",
  sourcemap: true,
})
