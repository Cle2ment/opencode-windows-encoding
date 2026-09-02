# AGENTS.md — opencode-windows-encoding

## 项目概述

OpenCode 插件，在 Windows + PowerShell 7 环境下自动为所有 `bash`/`shell` 工具调用注入 UTF-8 编码配置，解决 LLM 输出中文/非 ASCII 字符乱码问题。

## 技术栈

- **TypeScript** — 源码语言
- **tsup** — 构建工具（ESM 输出）
- **Node.js 内置模块** — 零 npm 运行时依赖
- **tsup** — 构建工具（ESM 输出）
- **Node.js 内置模块** — 零 npm 运行时依赖
- **@opencode-ai/plugin** — OpenCode 插件 API（`import type`，编译期擦除）

## 目录结构

```
src/
├── encoding-core.ts  # 共享核心（编码表 / shell 识别 / 前缀注入，零插件包依赖）
├── v1.ts             # V1 入口（tool.execute.before hook）
└── v2.ts             # V2 入口（{ id, setup } 契约，shell create.before hook）
scripts/
└── publish-v2.mjs    # beta 版本线发布脚本（manifest 临时指向 dist/v2.js 后 npm publish --tag beta）
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
5. 调试日志默认关闭，设 `OPENCODE_UTF8_DEBUG=1` 开启

V2 入口（src/v2.ts）使用 `shell create.before` hook，`event.shell` 由 opencode2 直接提供（已解析，可能为全路径/带 .exe），无需读取 client.config.get()。
## 编码规范

- 使用 `strict` TypeScript 模式
- 具名导出 `Utf8EncodingPlugin` + `default` 导出
- 零 npm 运行时依赖（`import type` 编译期擦除）
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

beta 线（OpenCode V2）：

1. `npm version 4.0.0-beta.0 --no-git-tag-version`（首个 beta；后续 beta 用 `npm version prerelease --preid=beta --no-git-tag-version`）
2. `npm run publish:beta` — 以 `--tag beta` 发布（脚本临时把 manifest 指向 dist/v2.js，发布后自动还原）
3. `git checkout -- package.json package-lock.json` — 还原版本号，主线保持 3.x
