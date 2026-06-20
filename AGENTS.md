# AGENTS.md — opencode-windows-encoding

## 项目概述

OpenCode 插件，在 Windows + PowerShell 7 环境下自动为所有 `bash`/`shell` 工具调用注入 UTF-8 编码配置，解决 LLM 输出中文/非 ASCII 字符乱码问题。

## 技术栈

- **TypeScript** — 源码语言
- **tsup** — 构建工具（ESM 输出）
- **@opencode-ai/plugin** — OpenCode 插件 API

## 目录结构

```
src/
├── index.ts          # 入口点，导出插件
└── utf8-encoding.ts  # 插件实现（tool.execute.before hook）
dist/                 # 构建输出（gitignore）
```

## 构建

```bash
npm install      # 安装依赖
npm run build    # tsup 构建 → dist/
npm run typecheck # tsc --noEmit 类型检查
```

## 插件机制

插件注册到 OpenCode 的 `tool.execute.before` hook：

1. 拦截所有 `bash`/`shell` 工具调用
2. 在原命令前注入 `[Console]::OutputEncoding=...` 前缀
3. 跳过已包含 `OutputEncoding` 的命令（防重复注入）
4. 保留 `set VAR="value" &&` 前缀顺序

## 编码规范

- 使用 `strict` TypeScript 模式
- 导出遵循 `Plugin` 类型签名的具名导出
- 最小依赖：仅 `@opencode-ai/plugin`
- 日志写入 `$TMP/utf8-plugin.log`（调试用，生产无感）

## 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：
- `feat:` — 新功能
- `fix:` — 修复
- `docs:` — 文档
- `ci:` — CI/CD

## 发布流程

1. `npm run build` — 构建
2. `npm version <patch|minor|major>` — 版本号
3. `npm publish` — 发布到 npm
4. `git push --follow-tags` — 推送标签
