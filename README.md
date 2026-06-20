# opencode-windows-encoding

[![npm version](https://img.shields.io/npm/v/opencode-windows-encoding)](https://www.npmjs.com/package/opencode-windows-encoding)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

OpenCode plugin that fixes UTF-8 encoding issues when executing PowerShell commands on Windows. Single-file, zero npm dependencies.

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
    "opencode-windows-encoding@^1.1"
  ]
}
```

After adding the plugin, restart OpenCode. All subsequent shell commands will use UTF-8 encoding automatically.
After adding the plugin, restart OpenCode. All subsequent shell commands will use UTF-8 encoding automatically.

## 本地使用（复制即用）

本项目是单文件插件，`src/utf8-encoding.ts` 可以直接复制到 OpenCode 插件目录使用，零依赖：

**PowerShell:**
```powershell
Copy-Item src/utf8-encoding.ts $env:USERPROFILE/.config/opencode/plugins/utf8-encoding.ts
```

**Bash / WSL:**
```bash
cp src/utf8-encoding.ts ~/.config/opencode/plugins/utf8-encoding.ts
```

重启 OpenCode 即生效。无需 `npm install`，无需构建。

`src/utf8-encoding.ts` 仅使用 Node.js 内置模块（`node:fs`, `node:os`, `node:path`），无任何 npm 依赖。
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

### 本地开发测试

直接引用源码即可：

```jsonc
{
  "plugin": [
    "/path/to/opencode-windows-encoding/src/utf8-encoding.ts"
  ]
}
```

## License

AGPL-3.0 — see [LICENSE](./LICENSE) for details.
