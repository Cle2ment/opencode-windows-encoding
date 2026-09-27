# AGENTS.md — opencode-windows-encoding

## 项目概述

OpenCode **V2** 插件（v6.0.0 起仅兼容 V2），在 Windows + PowerShell 7 环境下自动为所有 shell 命令注入 UTF-8 编码配置，解决 LLM 输出中文/非 ASCII 字符乱码问题。

## 技术栈

- **TypeScript** — 源码语言
- **tsup** — 构建工具（ESM 输出）
- **Node.js 内置模块** — 零 npm 运行时依赖
- **@opencode/plugin** — V2 插件 API 类型（`import type`，编译期擦除）

## 目录结构

```
src/
├── encoding-core.ts  # 共享核心（编码表 / shell 识别 / 前缀注入，零插件包依赖）
└── index.ts          # V2 入口：default 导出 { id, setup }（satisfies Plugin.Plugin）
dist/                 # 构建输出（gitignore）
```

## 构建

```bash
npm install      # 安装依赖
npm run build    # tsup 构建 → dist/
npm run typecheck # tsc --noEmit 类型检查
```

## 插件机制

插件注册 OpenCode V2 的 `shell create.before` hook：

1. `setup(ctx)` 注册 hook（轻量防御 `ctx?.shell?.hook?.(...)`，注册随插件卸载自动清理，无需手动 dispose）
2. 事件携带已解析的 shell（`event.shell`），按 shell 类型在 `event.command` 前注入对应编码前缀
3. 跳过已含编码 marker 的命令（幂等，防重复注入）
4. 保留 `set VAR="value" &&` 前缀顺序
5. 调试日志默认关闭，设 `OPENCODE_UTF8_DEBUG=1` 开启

加载契约（`satisfies Plugin.Plugin`，类型对照 `@opencode/plugin@^2.0.18` 的 `ShellCreateBefore` 事件结构核实）。
## 编码规范

- 使用 `strict` TypeScript 模式
- `default` 导出 `{ id, setup } satisfies Plugin.Plugin`（类型仅编译期依赖 `@opencode/plugin`）
- 零 npm 运行时依赖（`import type` 编译期擦除；dist 产物仅含 node 内置 import）
- 调试日志写入 `$TMP/utf8-plugin.log`，默认关闭（设 `OPENCODE_UTF8_DEBUG=1` 开启）

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：
- `feat:` — 新功能
- `fix:` — 修复
- `docs:` — 文档
- `ci:` — CI/CD

## 发布流程

1. `npm run build` — 构建
2. `npm version <patch|minor|major>` — 版本号
3. `git push --follow-tags` — 推送标签触发 GitHub Actions 自动发布 npm
