#!/usr/bin/env node
/**
 * Beta 版本线发布脚本（OpenCode V2 入口）— 仅使用 node 内置模块。
 *
 * 前提：package.json 的 version 必须是 beta 预发布版本（/-beta\.\d+$/）。
 * 流程：
 *   1. 校验版本号（非 beta 直接报错退出，不做任何改动）
 *   2. 备份原 package.json 文本
 *   3. 临时改写 manifest 入口指向 V2（main/types/exports → dist/v2.*）
 *   4. npm publish --tag beta（额外 argv 原样透传，如 --dry-run）
 *   5. finally 中恢复原 package.json（无论成功失败）
 */
import { readFileSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"

const MANIFEST = "package.json"
const original = readFileSync(MANIFEST, "utf8")

// 1. 版本守卫：主线版本（3.x）不允许走 beta 发布线
const version = JSON.parse(original).version
if (typeof version !== "string" || !/-beta\.\d+$/.test(version)) {
  console.error(`[publish-v2] version "${version}" 不是 beta 预发布版本（需匹配 /-beta\\.\\d+$/）。`)
  console.error("[publish-v2] 首个 beta：npm version 4.0.0-beta.0 --no-git-tag-version")
  console.error("[publish-v2] 后续 beta：npm version prerelease --preid=beta --no-git-tag-version")
  process.exit(1)
}

// 2. 备份原文（发布后逐字恢复）
// 3. 改写 manifest 指向 V2 入口
const beta = JSON.parse(original)
beta.main = "./dist/v2.js"
beta.types = "./dist/v2.d.ts"
beta.exports["."] = { types: "./dist/v2.d.ts", import: "./dist/v2.js" }
writeFileSync(MANIFEST, JSON.stringify(beta, null, 2) + "\n")

try {
  // 4. 发布（透传额外参数，如 --dry-run）
  const args = ["publish", "--tag", "beta", ...process.argv.slice(2)]
  const result = spawnSync("npm", args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  })
  if (result.status !== 0) process.exitCode = result.status ?? 1
} finally {
  // 5. 恢复原 package.json（无论成功失败）
  writeFileSync(MANIFEST, original)
}
