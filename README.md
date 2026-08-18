# Opencode Windows Encoding

[![npm version](https://img.shields.io/npm/v/opencode-windows-encoding)](https://www.npmjs.com/package/opencode-windows-encoding)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

OpenCode plugin that fixes UTF-8 encoding issues when executing shell commands on Windows. Single-file, zero npm runtime dependencies.

## The Problem

When OpenCode runs shell commands on Windows, the console output encoding defaults to the system locale (e.g., GBK for zh-CN). This causes garbled text when LLM-generated commands produce UTF-8 output — breaking file paths, error messages, and all non-ASCII content.

## How It Works

This plugin hooks into OpenCode's `tool.execute.before` event, detects the configured shell from OpenCode's config (`config.shell`), and injects the matching UTF-8 encoding configuration before every shell command:

**PowerShell (`pwsh`):**
```powershell
[Console]::OutputEncoding=[Console]::InputEncoding=[Text.Encoding]::UTF8;$OutputEncoding=[Text.Encoding]::UTF8;$env:PYTHONIOENCODING='utf-8';
```

**Bash / POSIX shells (`bash`, `zsh`, `sh`, ...):**
```bash
export LC_ALL=C.UTF-8; export LANG=C.UTF-8; export PYTHONIOENCODING=utf-8;
```

**Command Prompt (`cmd`):**
```bat
chcp 65001 >nul
```

### Key behaviors:
- **Shell auto-detection** — reads `config.shell` from OpenCode at startup; falls back to platform detection (`pwsh` on Windows, `bash` elsewhere) when unset or unavailable
- **Automatic injection** — applies to all `bash` and `shell` tool calls
- **Idempotent** — skips commands that already contain the shell's encoding marker (`OutputEncoding` / `LC_ALL` / `chcp`) to avoid duplication
- **`set` prefix aware** — preserves PowerShell `set VAR="value"` prefixes before injecting
- **Zero config** — works out of the box with no options
- **Debug logging off by default** — set `OPENCODE_UTF8_DEBUG=1` to enable diagnostic logging to `$TMP/utf8-plugin.log`

## Installation

```bash
npm install opencode-windows-encoding
```

## Usage

Add the plugin to your `opencode.jsonc`:

```jsonc
{
  "plugin": [
    "opencode-windows-encoding"
  ]
}
```

Or with a specific version:

```jsonc
{
  "plugin": [
    "opencode-windows-encoding@^1.1"
  ]
}
```

After adding the plugin, restart OpenCode. All subsequent shell commands will use UTF-8 encoding automatically.

## Local Usage (Copy & Go)

This is a single-file plugin. Copy `src/utf8-encoding.ts` directly to OpenCode's plugins directory — no dependencies required:

**PowerShell:**
```powershell
Copy-Item src/utf8-encoding.ts $env:USERPROFILE/.config/opencode/plugins/utf8-encoding.ts
```

**Bash / WSL:**
```bash
cp src/utf8-encoding.ts ~/.config/opencode/plugins/utf8-encoding.ts
```

Restart OpenCode to apply. No `npm install`, no build step.

`src/utf8-encoding.ts` uses only Node.js built-ins (`node:fs`, `node:os`, `node:path`) and a compile-time-only `import type` from `@opencode-ai/plugin` — zero npm runtime dependencies.
## Requirements

- **OpenCode** (any recent version with plugin support)
- **Windows** (this plugin is designed specifically for Windows encoding issues)
- **Any of**: PowerShell 7+ (`pwsh`), Bash, or Command Prompt (`cmd`)

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Type check
npm run typecheck

# Watch mode (for development)
npm run dev
```

### Local Development Testing

Reference the source file directly:
```jsonc
{
  "plugin": [
    "/path/to/opencode-windows-encoding/src/utf8-encoding.ts"
  ]
}
```

## License

AGPL-3.0 — see [LICENSE](./LICENSE) for details.
