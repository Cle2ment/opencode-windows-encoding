/**
 * OpenCode V2 Plugin — UTF-8 Encoding Fix for Windows
 *
 * V2 契约：default 导出 `{ id, setup }`（`satisfies Plugin`，类型来自
 * `@opencode/plugin`，仅编译期使用，运行产物零依赖）。setup 注册
 * `shell create.before` hook，在每次 shell 命令执行前按解析出的 shell
 * 注入 UTF-8 编码配置，解决中文/非 ASCII 字符乱码。
 * 事件契约见 @opencode/plugin 的 ShellCreateBefore。
 */

import type { Plugin } from "@opencode/plugin"
import { detectShellKind, flog, injectUtf8Prefix } from "./encoding-core.js"

/** V2 setup：注册 shell create.before 注入；注册随插件卸载自动清理 */
async function setup(ctx: Plugin.Context) {
  flog("=== LOADED ===")
  await ctx?.shell?.hook?.("create.before", (event) => {
    flog(`[shell.create.before] shell="${event.shell}"`)
    const kind = detectShellKind(event.shell)
    if (!kind) { flog("  skip (unknown shell)"); return }
    flog(`  shell kind: ${kind}`)
    const next = injectUtf8Prefix(event.command, kind)
    if (next === undefined) return // 幂等 skip 日志已由 core 输出
    event.command = next
    flog("  INJECTED")
  })
}

export default {
  id: "windows-encoding",
  setup,
} satisfies Plugin.Plugin
