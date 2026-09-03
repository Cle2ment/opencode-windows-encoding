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
├── v1.ts             # 主入口：三合一导出 { id, server, setup }（server = V1 tool.execute.before）
└── v2.ts             # V2 setup（shell create.before；宿主无 shell 域时降级 no-op）
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

V2 setup（src/v2.ts）在含 shell hook 域的宿主上注册 `shell create.before` hook（`event.shell` 已解析，无需读取 client.config.get()）；宿主无 shell 域（如 opencode 1.18.x）时降级 no-op，保证加载不失败、宿主升级后自动生效。

加载器差异（opencode 1.18.x 实测）：npm 包规格与 plugins/ 目录自动发现走新 V2 加载器（要求 default 导出 `{ id, effect | setup }`）；config 内本地路径走旧 V1 加载器（接受裸函数或 `{ server }`，`tool.execute.before` 可用）。v1.ts 的三合一 default 导出因此覆盖全部路径。另：plugins/ 目录的 `.js` 文件在 Windows 上解析不稳定，手动安装需改名为 `.ts`。
## 编码规范

- 使用 `strict` TypeScript 模式
- 具名导出 `Utf8EncodingPlugin`；`default` 导出三合一对象 `{ id, server, setup }`
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

beta 线（OpenCode V2）——**自 4.1.0 起废弃**：主线 default 导出已含 V2 `setup`，无需独立 beta 线。以下为历史流程存档：

1. `npm version 4.0.0-beta.0 --no-git-tag-version`（首个 beta；后续 beta 用 `npm version prerelease --preid=beta --no-git-tag-version`）
2. `npm run publish:beta` — 以 `--tag beta` 发布（脚本临时把 manifest 指向 dist/v2.js，发布后自动还原）
3. `git checkout -- package.json package-lock.json` — 还原版本号，主线保持 3.x
