import { defineConfig } from "tsup"

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  // 插件由 OpenCode 运行时加载，无 TS 消费场景；不生成 .d.ts（避免产物引用外部类型）
  dts: false,
  clean: true,
  target: "node18",
  outDir: "dist",
  sourcemap: true,
})
