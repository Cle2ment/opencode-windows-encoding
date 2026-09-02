import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/v1.ts", "src/v2.ts"],
  // 关闭 ESM 代码分割：两个入口各自内联 core，dist 产物仅含 node 内置 import
  splitting: false,
  format: ["esm"],
  dts: true,
  clean: true,
  target: "node18",
  outDir: "dist",
  sourcemap: true,
})
