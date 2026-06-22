# Security Policy

## Reporting a Vulnerability

This plugin injects text into shell commands executed by OpenCode. While the
attack surface is small, we take any security concern seriously.

**Please do not open a public issue for security vulnerabilities.**

Instead, report them privately via GitHub's Security Advisory system:

1. Go to [Security Advisories](https://github.com/Cle2ment/opencode-windows-encoding/security/advisories/new)
2. Click **"Report a vulnerability"**
3. Describe the issue in detail — include steps to reproduce if possible

You can also email yikun.chen@163.com with "SECURITY" in the subject line.

### What to Expect

- **Acknowledgment**: within 48 hours
- **Status update**: within 5 business days
- **Resolution timeline**: depends on severity — critical issues prioritized
  for same-week fix

We follow coordinated disclosure and will credit reporters (unless you prefer
to remain anonymous).

## Supported Versions

Only the latest released version receives security updates.

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | :white_check_mark: |
| 1.x     | :x:                |

## Security Considerations

This plugin operates at the shell-command level inside OpenCode:

- **Command injection**: The plugin prepends encoding configuration to shell
  commands. It checks for existing `OutputEncoding` tokens to avoid duplication
  and preserves `set` prefix order, but does not modify the user's original
  command content.
- **No network access**: The plugin has zero npm runtime dependencies and makes
  no network calls.
- **Debug logging**: When `OPENCODE_UTF8_DEBUG=1` is set, command contents are
  written to `$TMP/utf8-plugin.log`. Keep this disabled in sensitive
  environments.

If you discover that a specially crafted command can bypass the encoding
injection in a way that causes unintended behavior, please report it.
