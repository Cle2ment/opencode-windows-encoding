/**
 * OpenCode V2 Plugin — UTF-8 Encoding Fix for Windows
 *
 * V2 契约（{ id, setup }）。setup 在含 shell hook 域的 V2 宿主上注册
 * shell create.before hook（事件契约对照 opencode dev 分支
 * packages/plugin/src/promise/shell.ts 核实）；宿主缺少 shell 域
 * （如 opencode 1.18.x）时降级为 no-op——保证插件始终可加载、不报错，
 * 待宿主升级后自动生效。类型为自包含最小结构声明，仅依赖结构匹配。
 */

import { detectShellKind, flog, injectUtf8Prefix } from "./encoding-core.js"

/** shell create.before 事件（对照 dev 分支 ShellCreateBefore） */
export interface ShellCreateBeforeEvent {
  command: string
  cwd: string
  timeout: number
  shell: string
  env: Record<string, string | undefined>
}
export interface HookRegistration { dispose(): Promise<void> | void }
interface ShellDomain {
  hook(
    name: "create.before",
    cb: (event: ShellCreateBeforeEvent) => void | Promise<void>,
  ): Promise<HookRegistration> | HookRegistration
}
/** V2 宿主上下文的最小结构声明：仅声明本插件用到的（可选）shell 域 */
export interface PluginContextV2 {
  shell?: ShellDomain
}
interface PluginV2 {
  id: string
  setup(ctx: PluginContextV2): void | (() => void | Promise<void>) | Promise<void | (() => void | Promise<void>)>
}

/** V2 setup：有 shell hook 域则注册注入，否则静默降级（no-op） */
export async function setup(ctx: PluginContextV2) {
  flog("=== LOADED (v2) ===")
  const shell = ctx?.shell
  if (!shell || typeof shell.hook !== "function") {
    flog("  host has no shell hook domain; degrade to no-op")
    return
  }
  const registration = await shell.hook("create.before", (event) => {
    flog(`[shell.create.before] shell="${event.shell}"`)
    const kind = detectShellKind(event.shell)
    if (!kind) { flog("  skip (unknown shell)"); return }
    flog(`  shell kind: ${kind}`)
    const next = injectUtf8Prefix(event.command, kind)
    if (next === undefined) return // 幂等 skip 日志已由 core 输出
    event.command = next
    flog("  INJECTED")
  })
  return async () => { await registration.dispose?.() }
}

const Utf8EncodingPluginV2: PluginV2 = {
  id: "utf8-encoding",
  setup,
}
export default Utf8EncodingPluginV2
