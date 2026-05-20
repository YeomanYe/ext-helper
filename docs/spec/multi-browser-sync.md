---
id: multi-browser-sync
title: 多浏览器同步
status: ready-for-review
created: 2026-05-20
updated: 2026-05-20
project_root: /Users/ym/Documents/projects/ext-helper
needs_visual_check: false
---

## 目标

让 Groups、Rules、偏好设置通过浏览器原生 `storage.sync` 持久化和同步，使同一浏览器账号下的 Chrome / Edge / Firefox 用户在不同设备上拿到一致配置。首版不建设云端服务，也不承诺 Chrome 账号与 Firefox 账号之间互通。

## 现状

- `CLAUDE.md:18` 说明项目同时支持 extension mode 和 web preview mode，数据访问统一走 `src/services/*Repo.ts`。
- `src/services/browser/adapter.ts:161` 到 `src/services/browser/adapter.ts:194` 已提供 `getSyncStorage`、`setSyncStorage`、`removeSyncStorage`，并在 `src/services/browser/adapter.ts:198` 提供 sync 变更监听入口。
- `src/services/groupsRepo.ts:21` 到 `src/services/groupsRepo.ts:40` 已实现 Groups 从 local storage 迁移到 sync storage，`src/services/groupsRepo.ts:45` 到 `src/services/groupsRepo.ts:84` 已按 index + item key 读写 sync。
- `src/services/rulesRepo.ts:32` 到 `src/services/rulesRepo.ts:51` 已实现 Rules 从 local storage 迁移到 sync storage，`src/services/rulesRepo.ts:56` 到 `src/services/rulesRepo.ts:91` 已按 index + item key 读写 sync。
- `src/services/preferencesRepo.ts:21` 和 `src/services/preferencesRepo.ts:32` 仍使用 `browserAdapter.getStorage` / `setStorage`，Preferences 尚未迁移到 sync。
- `src/stores/uiStore.ts:71` 到 `src/stores/uiStore.ts:98` 只在初始化时 fetch preferences，当前没有消费 `storage.sync` 外部变更。
- `src/services/__tests__/repos.test.ts:345` 到 `src/services/__tests__/repos.test.ts:380` 已覆盖 preferencesRepo 的 devStorage 行为，但还缺 extension mode 下 sync 迁移和 sync 写入测试。

## 方案选项

1. 浏览器原生 `storage.sync` 方案
   - 优点：无需新增后端和依赖，已有 adapter、Groups、Rules 代码可复用；符合扩展权限中已声明的 `storage` 能力。
   - 缺点：Chrome / Edge / Firefox 的账号体系彼此独立，不能实现跨厂商云端互通；还要注意 sync quota 和写入频率。
2. 文件导出 / 导入方案
   - 优点：跨浏览器厂商可用，不受 sync quota 限制。
   - 缺点：需要用户手动操作，不是自动同步；还会引入冲突处理和导入预览交互。
3. 自建云端同步方案
   - 优点：可以真正跨 Chrome / Edge / Firefox 账号体系同步，并可做冲突解决。
   - 缺点：需要认证、后端、隐私策略和运维；对当前扩展的复杂度和风险过高。

## 推荐方案 + 理由

推荐方案 1：先把本地配置同步能力统一收敛到浏览器原生 `storage.sync`。

这个方案可被检验：实现后，Groups、Rules、Preferences 的 extension mode repo 都应只通过 sync storage 读写主数据，并保留一次性 local-to-sync 迁移；dev:web 仍走 `devStorage`，现有 web preview 不受影响。它没有新增账号体系或后端，能在现有架构里用单元测试验证存储 key、迁移路径、删除清理和偏好合并行为。

## 影响范围

- `src/services/preferencesRepo.ts`：约 35 行。新增 sync key / 迁移 flag，将 extension mode 偏好设置迁移并保存到 `storage.sync`。
- `src/services/groupsRepo.ts`：约 20 行。梳理已有 sync 迁移，必要时导出 key 或补齐错误处理，确保清空 groups 时 index 与 item key 一致。
- `src/services/rulesRepo.ts`：约 20 行。梳理已有 sync 迁移，确保删除 rules 时移除旧 item key。
- `src/services/browser/adapter.ts`：约 10 行。必要时补一个 local storage remove 或 storage change helper；优先复用现有 sync API。
- `src/stores/uiStore.ts`：约 35 行。可选接入 sync change 后刷新 preferences，避免其它设备修改后当前运行实例长期不更新。
- `src/services/__tests__/repos.test.ts` 或新增 `src/services/__tests__/syncRepos.test.ts`：约 120 行。覆盖 extension mode 下 preferences sync 迁移、groups/rules index + item 写入、删除清理。
- 总估算行数：约 240 行。
- 新增依赖：无。
- 影响公开 API / 类型：无对外公开 API 变化；内部 repo 行为从 local 主存储变为 sync 主存储。

## 验收标准

- [x] extension mode 下 `preferencesRepo.fetch()` 首次读取时能把旧 `ext-helper-preferences` local 数据迁移到 sync，并设置一次性迁移标记。
- [x] extension mode 下 `preferencesRepo.save()` 合并已有偏好后写入 sync，后续 `fetch()` 返回最新合并结果。
- [x] extension mode 下 Groups 仍按 index + item key 从 sync 读取，`saveAll([])` 后不会残留旧 group item key。
- [x] extension mode 下 Rules 仍按 index + item key 从 sync 读取，删除规则后不会残留旧 rule item key。
- [x] dev:web 模式继续使用 `devStorage`，不访问 `browser.storage.sync`。
- [x] 不新增云端服务、账号认证或跨厂商同步依赖；文档或代码注释中明确首版为浏览器原生 sync。
- [x] 所有现有测试通过
- [x] lint clean / build success

## 风险

**⚠️ 高风险：本改动涉及存储迁移，并改变 extension mode 下偏好设置的主存储位置。**

- 浏览器原生 `storage.sync` 有 quota 限制，Groups / Rules 已采用 index + item 拆分，Preferences 应保持小对象存储，避免写入过大结构。回滚方案：保留 local storage 迁移源，不删除旧 local 数据，出现问题时把 repo 主读写切回 local。
- Chrome / Edge / Firefox 的 sync 账号体系不互通，首版只能保证同厂商账号和同扩展 ID 下同步。回滚方案：将 TODO 拆出后续的文件导入导出或云端同步 spec。
- 多设备并发写入可能出现后写覆盖先写。回滚方案：首版接受 last-write-wins，不引入冲突合并；后续再加入 `updatedAt` 或版本戳。
- 如果测试 mock 只覆盖 devStorage，容易漏掉 extension mode 的 sync 行为。回滚方案：新增 browserAdapter mock，单独验证 sync key 和迁移 flag。

## Decisions log

- **2026-05-20**: 初版 spec，选择浏览器原生 `storage.sync` 作为首版方案，不引入云端或文件导入导出。
- **2026-05-20**: 高风险信号：存储迁移、跨浏览器同步语义限制（已记入"风险"区段，但仍 approved）
- **2026-05-20**: 实现完成，Preferences 迁移到浏览器原生 `storage.sync`；Groups/Rules sync 清理行为用 extension-mode 单测锁定。
- **2026-05-20**: 为满足完整测试 hard gate，顺手修复 `src/stores/extensionStore.ts` 中 `finishBisectRestore()` 复用 cancel fallback 文案的既有失败。
