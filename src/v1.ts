/**
 * OpenCode Plugin — UTF-8 Encoding Fix for Windows (V1)
 *
 * V1 入口（tool.execute.before 契约），共享逻辑见 ./encoding-core.ts。
 *
 * 工作原理：拦截所有 bash/shell 工具调用，读取 opencode 配置的 shell
 * （pwsh / bash / cmd），按对应 shell 在命令前注入对应的 UTF-8 编码配置，
 * 解决中文/非 ASCII 字符乱码问题。未配置 shell 时不注入。
 */

import type { PluginInput } from "@opencode-ai/plugin"
import { detectShellKind, flog, injectUtf8Prefix, type ShellKind } from "./encoding-core.js"

/** 带超时的 Promise（插件内不引入额外运行时依赖） */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms)
    p.then(
      (v) => { clearTimeout(t); resolve(v) },
      (e) => { clearTimeout(t); reject(e) },
    )
  })
}

/** 读取 opencode 配置中的 shell，失败/超时/未配置返回 undefined（不注入，永不 reject） */
async function resolveShellKind(client: PluginInput["client"]): Promise<ShellKind | undefined> {
  try {
    const res = await withTimeout(client.config.get(), 3000)
    const shell = (res.data as unknown as { shell?: string } | undefined)?.shell
    return detectShellKind(shell)
  } catch {
    return undefined
  }
}

export const Utf8EncodingPlugin = async (input: PluginInput) => {
  flog("=== LOADED ===")

  // 惰性检测：绝不在插件加载阶段调用 client.config.get()
  //（会因 httpapi 未就绪 + 请求无超时而永久挂起，导致 opencode 启动死锁）。
  // 首次 tool hook 触发时再查，结果缓存。
  let kindPromise: Promise<ShellKind | undefined> | null = null
  const getKind = () => (kindPromise ??= resolveShellKind(input.client))

  return {
    "tool.execute.before": async (input: { tool: string; sessionID: string; callID: string }, output: { args: any }) => {
      const tool = String(input?.tool ?? "")
      flog(`[tool.before] tool="${tool}"`)

      if (tool !== "bash" && tool !== "shell") return

      const args = output.args
      if (!args) { flog("  no args"); return }

      const cmd = args.command
      if (typeof cmd !== "string" || !cmd) {
        flog(`  args keys: ${JSON.stringify(Object.keys(args))}`)
        return
      }

      const kind = await getKind()
      if (!kind) { flog("  skip (no shell configured)"); return }
      flog(`  shell kind: ${kind}`)

      const next = injectUtf8Prefix(cmd, kind)
      if (next === undefined) return // 幂等 skip 日志已由 core 输出

      args.command = next
      flog("  INJECTED")
    },
  }
}

export default Utf8EncodingPlugin
