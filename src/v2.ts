/**
 * OpenCode V2 (opencode2) Plugin — UTF-8 Encoding Fix for Windows
 *
 * V2 入口（{ id, setup } 契约）。类型为自包含最小结构声明，
 * 已对照 @opencode-ai/plugin@0.0.0-beta-18866（npm dist-tag beta）验证；
 * V2 插件 API 在 beta 期间可能变动，升级时需重新核对。
 */

import { detectShellKind, flog, injectUtf8Prefix } from "./encoding-core.js"

interface ShellCreateBeforeEvent {
  command: string
  cwd: string
  timeout: number
  shell: string
  env: Record<string, string | undefined>
}
interface HookRegistration { dispose(): Promise<void> }
interface PluginContextV2 {
  shell: {
    hook(name: "create.before", cb: (event: ShellCreateBeforeEvent) => void | Promise<void>): Promise<HookRegistration>
  }
}
interface PluginV2 {
  id: string
  setup(ctx: PluginContextV2): void | (() => void | Promise<void>) | Promise<void | (() => void | Promise<void>)>
}

const Utf8EncodingPluginV2: PluginV2 = {
  id: "utf8-encoding",
  async setup(ctx) {
    flog("=== LOADED (v2) ===")
    const registration = await ctx.shell.hook("create.before", (event) => {
      flog(`[shell.create.before] shell="${event.shell}"`)
      const kind = detectShellKind(event.shell)
      if (!kind) { flog("  skip (unknown shell)"); return }
      flog(`  shell kind: ${kind}`)
      const next = injectUtf8Prefix(event.command, kind)
      if (next === undefined) return // 幂等 skip 日志已由 core 输出
      event.command = next
      flog("  INJECTED")
    })
    return () => registration.dispose()
  },
}
export default Utf8EncodingPluginV2
