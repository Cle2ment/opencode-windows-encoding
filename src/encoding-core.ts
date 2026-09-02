/**
 * 共享核心 — UTF-8 编码前缀注入逻辑
 *
 * 由 V1（v1.ts）与 V2（v2.ts）入口共同复用；
 * 仅依赖 Node.js 内置模块，不引用任何插件包类型。
 */

import { appendFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

// 调试日志（写入临时目录，默认关闭，设 OPENCODE_UTF8_DEBUG=1 开启）
const DEBUG = process.env.OPENCODE_UTF8_DEBUG === "1"
const LOG = join(tmpdir(), "utf8-plugin.log")
export function flog(msg: string) {
  if (!DEBUG) return
  try { appendFileSync(LOG, `[${new Date().toISOString()}] ${msg}\n`, "utf8") } catch {}
}

export type ShellKind = "pwsh" | "bash" | "cmd"

// ── 各 shell 的 UTF-8 编码前缀与命令分隔符 ──
export const ENC: Record<ShellKind, { prefix: string; sep: string; marker: string }> = {
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

/** 由 shell 路径/名称（可能含目录与 .exe 后缀）归一化为 shell 类型；无法识别返回 undefined（不注入） */
export function detectShellKind(shell: string | undefined): ShellKind | undefined {
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

/** 提取 opencode 在命令前追加的 set VAR="value" && 前缀 */
export function stripSetPrefixes(cmd: string): { prefixes: string; cleanCmd: string } {
  const m = cmd.match(/^((?:set\s+\w+="[^"]*"\s*&&\s*)+)/)
  if (m) return { prefixes: m[1], cleanCmd: cmd.slice(m[1].length) }
  return { prefixes: "", cleanCmd: cmd }
}

/** 在命令前注入 UTF-8 编码前缀；已含 marker（幂等）时返回 undefined */
export function injectUtf8Prefix(cmd: string, kind: ShellKind): string | undefined {
  const { prefixes, cleanCmd } = stripSetPrefixes(cmd)
  flog(`  orig: ${cleanCmd.slice(0, 120)}`)

  const { prefix, sep, marker } = ENC[kind]

  // 防止重复注入
  if (cleanCmd.includes(marker)) { flog("  skip (idempotent)"); return undefined }

  return prefixes + prefix + sep + cleanCmd
}
