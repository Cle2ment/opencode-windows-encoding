# Opencode Windows Encoding

[![npm version](https://img.shields.io/npm/v/opencode-windows-encoding)](https://www.npmjs.com/package/opencode-windows-encoding)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

OpenCode **V2** plugin that fixes UTF-8 encoding issues when executing shell commands on Windows. Zero npm runtime dependencies.

> **v6.0.0 is V2-only.** If you run OpenCode V1 (`opencode` ≤ 1.x), stay on the v5.x line.

## The Problem

When OpenCode runs shell commands on Windows, the console output encoding defaults to the system locale (e.g., GBK for zh-CN). This causes garbled text when LLM-generated commands produce UTF-8 output — breaking file paths, error messages, and all non-ASCII content.

## How It Works

This plugin registers OpenCode V2's `shell create.before` hook. OpenCode passes the already-resolved shell on the event (`event.shell`), and the plugin injects the matching UTF-8 encoding configuration before every shell command:

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
- **Shell auto-detection** — uses the resolved shell from the `create.before` event; no config lookup needed
- **Automatic injection** — applies to every shell command the agent runs
- **Idempotent** — skips commands that already contain the shell's encoding marker (`OutputEncoding` / `LC_ALL` / `chcp`) to avoid duplication
- **`set` prefix aware** — preserves `set VAR="value" &&` prefixes before injecting
- **Zero config** — works out of the box with no options
- **Debug logging off by default** — set `OPENCODE_UTF8_DEBUG=1` to enable diagnostic logging to `$TMP/utf8-plugin.log`

## Requirements

- **OpenCode V2** — this version requires the V2 plugin API
- **Windows** (this plugin is designed specifically for Windows encoding issues)
- **Any of**: PowerShell 7+ (`pwsh`), Bash, or Command Prompt (`cmd`)

## Installation

Add the plugin to your `opencode.jsonc`:

```jsonc
{
  "plugins": [
    "opencode-windows-encoding"
  ]
}
```

Or with a specific version:

```jsonc
{
  "plugins": [
    "opencode-windows-encoding@^6"
  ]
}
```

Then run `opencode` — or reload plugins with `opencode plugin reload`. All subsequent shell commands will use UTF-8 encoding automatically. Verify with `opencode plugin list`.

## Local Usage (Copy & Go)

The built plugin is a single self-contained ESM file. From a clone of this repo:

```bash
npm install && npm run build
```

**PowerShell:**
```powershell
Copy-Item dist/index.js $env:USERPROFILE/.config/opencode/plugins/utf8-encoding.js
```

**Bash / WSL:**
```bash
cp dist/index.js ~/.config/opencode/plugins/utf8-encoding.js
```

Restart OpenCode to apply.

The built file uses only Node.js built-ins (`node:fs`, `node:os`, `node:path`) — `@opencode/plugin` is `import type` only (compile-time, erased from output). Zero npm runtime dependencies.

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
  "plugins": [
    "/path/to/opencode-windows-encoding/src/index.ts"
  ]
}
```

## License

AGPL-3.0 — see [LICENSE](./LICENSE) for details.
