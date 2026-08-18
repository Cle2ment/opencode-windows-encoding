/**
 * OpenCode Plugin — UTF-8 Encoding Fix for Windows
 *
 * 单文件插件，可直接复制到 ~/.config/opencode/plugins/ 使用，无需 npm install。
 *
 * 工作原理：拦截所有 bash/shell 工具调用，读取 opencode 配置的 shell
 * （pwsh / bash / cmd），按对应 shell 在命令前注入对应的 UTF-8 编码配置，
 * 解决中文/非 ASCII 字符乱码问题。未配置 shell 时不注入。
 */

import { appendFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import type { PluginInput } from "@opencode-ai/plugin"

// 调试日志（写入临时目录，默认关闭，设 OPENCODE_UTF8_DEBUG=1 开启）
const DEBUG = process.env.OPENCODE_UTF8_DEBUG === "1"
const LOG = join(tmpdir(), "utf8-plugin.log")
function flog(msg: string) {
  if (!DEBUG) return
  try { appendFileSync(LOG, `[${new Date().toISOString()}] ${msg}\n`, "utf8") } catch {}
}

type ShellKind = "pwsh" | "bash" | "cmd"

// ── 各 shell 的 UTF-8 编码前缀与命令分隔符 ──
const ENC: Record<ShellKind, { prefix: string; sep: string; marker: string }> = {
  pwsh: {
    prefix:
      "[Console]::OutputEncoding=[Console]::InputEncoding=[Text.Encoding]::UTF8;" +
      "$OutputEncoding=[Text.Encoding]::UTF8;" +
      "$env:PYTHONIOENCODING='utf-8';",
    sep: "\n",
    marker: "OutputEncoding",
  },
  bash: {
    prefix: "export LC_ALL=C.UTF-8; export LANG=C.UTF-8; export PYTHONIOENCODING=utf-8;",
    sep: "\n",
    marker: "LC_ALL",
  },
  cmd: {
    prefix: "chcp 65001 >nul",
    sep: " & ",
    marker: "chcp",
  },
}

/** 由 config.shell 的值归一化为 shell 类型；未配置返回 undefined（不注入） */
function detectShellKind(shell: string | undefined): ShellKind | undefined {
  if (!shell) return undefined
  const base = shell
    .replace(/\\/g, "/")
    .split("/")
    .pop()!
    .toLowerCase()
    .replace(/\.exe$/, "")
  if (base === "pwsh" || base === "powershell") return "pwsh"
  if (base === "cmd") return "cmd"
  return "bash" // bash / zsh / sh / dash / ksh 等 POSIX shell
}

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

/** 提取 opencode 在命令前追加的 set VAR="value" && 前缀 */
function stripSetPrefixes(cmd: string): { prefixes: string; cleanCmd: string } {
  const m = cmd.match(/^((?:set\s+\w+="[^"]*"\s*&&\s*)+)/)
  if (m) return { prefixes: m[1], cleanCmd: cmd.slice(m[1].length) }
  return { prefixes: "", cleanCmd: cmd }
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

      const { prefixes, cleanCmd } = stripSetPrefixes(cmd)
      flog(`  orig: ${cleanCmd.slice(0, 120)}`)

      const kind = await getKind()
      if (!kind) { flog("  skip (no shell configured)"); return }
      const { prefix, sep, marker } = ENC[kind]
      flog(`  shell kind: ${kind}`)

      // 防止重复注入
      if (cleanCmd.includes(marker)) { flog("  skip (idempotent)"); return }

      args.command = prefixes + prefix + sep + cleanCmd
      flog("  INJECTED")
    },
  }
}

export default Utf8EncodingPlugin
