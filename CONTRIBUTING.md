# Contributing to opencode-windows-encoding

Thanks for your interest in contributing! This is a small, focused plugin — the
bar for changes is intentionally high to keep things simple and reliable.

## Before You Start

- **Open an issue first** for any change beyond a typo fix. This lets us discuss
  whether the change aligns with the project's scope before you write code.
- This plugin follows a **"do one thing well"** philosophy. Features that add
  configuration complexity will generally be rejected unless the use case is
  overwhelmingly common.

## Development Setup

```bash
# Clone and install
git clone https://github.com/Cle2ment/opencode-windows-encoding.git
cd opencode-windows-encoding
npm install
```

```bash
# Type check
npm run typecheck

# Build
npm run build

# Watch mode (auto-rebuild on change)
npm run dev
```

## Project Structure

```
src/
└── utf8-encoding.ts  # Single-file plugin — all logic lives here
```

The plugin is a single TypeScript file. Build output goes to `dist/`.

## Code Style

- **Strict TypeScript** — `tsconfig.json` enforces strict mode. No `as any`,
  no `@ts-ignore`.
- **Zero npm runtime dependencies** — the plugin uses only Node.js built-ins
  (`node:fs`, `node:os`, `node:path`). `@opencode-ai/plugin` is `import type`
  only (compile-time, erased from output).
- Match existing patterns — follow the code already in `src/utf8-encoding.ts`.
- Debug logging goes to `$TMP/utf8-plugin.log` and is gated behind
  `OPENCODE_UTF8_DEBUG=1`.

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation only
- `ci:` — CI/CD changes
- `chore:` — maintenance

## Local Testing

Reference the source file directly in your `opencode.jsonc`:

```jsonc
{
  "plugin": [
    "/path/to/opencode-windows-encoding/src/utf8-encoding.ts"
  ]
}
```

Then exercise the plugin by running shell commands in OpenCode. Enable debug
logs to inspect behavior:

```powershell
$env:OPENCODE_UTF8_DEBUG = "1"
```

## Pull Request Process

1. Fork the repo and create a branch.
2. Make your changes, keeping them minimal and focused.
3. Run `npm run typecheck` and `npm run build` — both must pass.
4. Open a PR against `main`. Include:
   - What problem the change solves
   - How you tested it
   - Any breaking changes or considerations

## License

By contributing, you agree that your contributions will be licensed under the
[AGPL-3.0](LICENSE).
