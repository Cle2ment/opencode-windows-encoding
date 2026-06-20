/**
 * OpenCode Plugin — UTF-8 Encoding Fix for Windows + PowerShell
 *
 * 单文件插件，可直接复制到 ~/.config/opencode/plugins/ 使用，无需 npm install。
 *
 * 工作原理：拦截所有 bash/shell 工具调用，在命令前注入 PowerShell
 * UTF-8 编码配置，解决 Windows 下中文/非 ASCII 字符乱码问题。
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

// ── PowerShell UTF-8 编码前缀 ──
const UTF8_ENC =
  "[Console]::OutputEncoding=[Console]::InputEncoding=[Text.Encoding]::UTF8;$OutputEncoding=[Text.Encoding]::UTF8;"

/** 提取 opencode 在命令前追加的 set VAR="value" && 前缀 */
function stripSetPrefixes(cmd: string): { prefixes: string; cleanCmd: string } {
  const m = cmd.match(/^((?:set\s+\w+="[^"]*"\s*&&\s*)+)/)
  if (m) return { prefixes: m[1], cleanCmd: cmd.slice(m[1].length) }
  return { prefixes: "", cleanCmd: cmd }
}

export const Utf8EncodingPlugin = async (_input: PluginInput) => {
  flog("=== LOADED ===")

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

      // 防止重复注入
      if (cleanCmd.includes("OutputEncoding")) { flog("  skip (idempotent)"); return }

      args.command = prefixes + UTF8_ENC + "\n" + cleanCmd
      flog("  INJECTED")
    },
  }
}

export default Utf8EncodingPlugin
