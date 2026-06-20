import type { Plugin } from "@opencode-ai/plugin"
import { appendFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const LOG = join(tmpdir(), "utf8-plugin.log")
function flog(msg: string) {
  try { appendFileSync(LOG, `[${new Date().toISOString()}] ${msg}\n`, "utf8") } catch {}
}

export const Utf8EncodingPlugin: Plugin = async () => {
  flog("=== LOADED ===")

  function stripSetPrefixes(cmd: string): { prefixes: string; cleanCmd: string } {
    const m = cmd.match(/^((?:set\s+\w+="[^"]*"\s*&&\s*)+)/)
    if (m) return { prefixes: m[1], cleanCmd: cmd.slice(m[1].length) }
    return { prefixes: "", cleanCmd: cmd }
  }

  const UTF8_ENC = "[Console]::OutputEncoding=[Console]::InputEncoding=[Text.Encoding]::UTF8;$OutputEncoding=[Text.Encoding]::UTF8;"

  return {
    // ── LLM 工具调用 (bash/shell) ──
    "tool.execute.before": async (input, output) => {
      const tool = String(input?.tool ?? "")
      flog(`[tool.before] tool="${tool}"`)

      if (tool !== "bash" && tool !== "shell") return

      const args = output?.args as Record<string, unknown> | undefined
      if (!args) { flog("  no args"); return }

      const cmd = args.command
      if (typeof cmd !== "string" || !cmd) {
        flog(`  args keys: ${JSON.stringify(Object.keys(args))}`)
        return
      }

      const { prefixes, cleanCmd } = stripSetPrefixes(cmd)
      flog(`  orig: ${cleanCmd.slice(0, 120)}`)

      if (cleanCmd.includes("OutputEncoding")) { flog("  skip (idempotent)"); return }

      args.command = prefixes + UTF8_ENC + cleanCmd
      flog(`  INJECTED`)
    },
  }
}
