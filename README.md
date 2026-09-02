# Opencode Windows Encoding

[![npm version](https://img.shields.io/npm/v/opencode-windows-encoding)](https://www.npmjs.com/package/opencode-windows-encoding)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

OpenCode plugin that fixes UTF-8 encoding issues when executing shell commands on Windows. Zero npm runtime dependencies.

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

## Installation (OpenCode V1)

```bash
npm install opencode-windows-encoding
```

## Usage (OpenCode V1)

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

## OpenCode V2 (opencode2)

OpenCode V2 is in beta and uses a different plugin contract (`{ id, setup }`). This package ships a dedicated V2 line on the npm `beta` dist-tag:

```bash
opencode plugin add opencode-windows-encoding@beta
```

Or configure it in `opencode.jsonc`:

```jsonc
{
  "plugins": [
    "opencode-windows-encoding@beta"
  ]
}
```

The V2 build injects the encoding prefix via the `shell create.before` hook. The resolved shell is provided directly on the event (`event.shell`, possibly a full path with `.exe`), so the plugin does not need to read `config.shell`.

> Note: the V2 plugin API is still in beta and its contract may change. If anything breaks after upgrading opencode2, please report it.

## Local Usage (Copy & Go)

The built V1 plugin is a single self-contained JavaScript file (the shared core is bundled inline). From a clone of this repo:

```bash
npm install && npm run build
```

Then copy `dist/v1.js` to OpenCode's plugins directory:

**PowerShell:**
```powershell
Copy-Item dist/v1.js $env:USERPROFILE/.config/opencode/plugins/utf8-encoding.js
```

**Bash / WSL:**
```bash
cp dist/v1.js ~/.config/opencode/plugins/utf8-encoding.js
```

Restart OpenCode to apply.

The built file uses only Node.js built-ins (`node:fs`, `node:os`, `node:path`) and a compile-time-only `import type` from `@opencode-ai/plugin` — zero npm runtime dependencies.
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
    "/path/to/opencode-windows-encoding/src/v1.ts"
  ]
}
```

## License

AGPL-3.0 — see [LICENSE](./LICENSE) for details.
