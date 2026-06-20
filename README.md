# opencode-windows-encoding

[![npm version](https://img.shields.io/npm/v/opencode-windows-encoding)](https://www.npmjs.com/package/opencode-windows-encoding)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

OpenCode plugin that fixes UTF-8 encoding issues when executing PowerShell commands on Windows.

## The Problem

When OpenCode runs shell commands via PowerShell (`pwsh`) on Windows, the console output encoding defaults to the system locale (e.g., GBK for zh-CN). This causes garbled text when LLM-generated commands produce UTF-8 output — breaking file paths, error messages, and all non-ASCII content.

## How It Works

This plugin hooks into OpenCode's `tool.execute.before` event and injects UTF-8 encoding configuration before every PowerShell command:

```powershell
[Console]::OutputEncoding=[Console]::InputEncoding=[Text.Encoding]::UTF8;$OutputEncoding=[Text.Encoding]::UTF8;
```

### Key behaviors:
- **Automatic injection** — applies to all `bash` and `shell` tool calls
- **Idempotent** — skips commands that already contain `OutputEncoding` to avoid duplication
- **`set` prefix aware** — preserves PowerShell `set VAR="value"` prefixes before injecting
- **Zero config** — works out of the box with no options

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
    "opencode-windows-encoding@1.0.0"
  ]
}
```

After adding the plugin, restart OpenCode. All subsequent shell commands will use UTF-8 encoding automatically.

## Requirements

- **OpenCode** (any recent version with plugin support)
- **PowerShell 7+** (`pwsh`)
- **Windows** (this plugin is designed specifically for Windows encoding issues)

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

### Local plugin testing

To test locally without publishing, reference the build output in your `opencode.jsonc`:

```jsonc
{
  "plugin": [
    "/path/to/opencode-windows-encoding/dist/index.js"
  ]
}
```

Or reference the TypeScript source directly:

```jsonc
{
  "plugin": [
    "/path/to/opencode-windows-encoding/src/index.ts"
  ]
}
```

## License

AGPL-3.0 — see [LICENSE](./LICENSE) for details.
