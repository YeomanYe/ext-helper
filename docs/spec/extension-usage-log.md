---
id: extension-usage-log
title: 扩展使用日志
status: approved
created: 2026-05-20
updated: 2026-05-20
project_root: /Users/ym/Documents/projects/ext-helper
needs_visual_check: true
---

## 目标

为 Ext Helper 增加扩展使用日志，记录扩展启用、禁用、安装、卸载历史，并在 popup 中提供可查看的最近事件与基础统计。完成后用户可以追溯最近哪些扩展状态发生了变化，以及每个扩展的启用/禁用次数。

## 现状

- `src/services/browser/adapter.ts:117` 已封装 `management.onInstalled`，`src/services/browser/adapter.ts:123` 已封装 `management.onUninstalled`，`src/services/browser/adapter.ts:130` 已封装 `management.onEnabledChanged`，但当前没有业务层消费这些生命周期事件。
- `src/services/browser/adapter.ts:138` 和 `src/services/browser/adapter.ts:150` 提供 `browser.storage.local` 的读写封装，可作为本地使用日志的持久化入口。
- `src/services/extensionsRepo.ts:17` 负责扩展管理数据访问，`src/services/extensionsRepo.ts:30` 的 `setEnabled` 与 `src/services/extensionsRepo.ts:39` 的 `applySnapshot` 已覆盖单个和批量启用状态变更，但只执行变更，不记录历史。
- `src/stores/extensionStore.ts:67` 的 `toggleExtension`、`src/stores/extensionStore.ts:129` 的 `setExtensionsEnabled`、`src/stores/extensionStore.ts:167` 的 `undoExtensions`/`redoExtensions` 已有乐观更新和回滚路径，日志写入需要避免破坏这些路径。
- `src/background/index.ts:23` 已有后台初始化入口，当前只注册规则自动化监听；适合新增 usage log 事件监听服务，避免依赖 popup 打开状态。
- `src/components/PopupPage.tsx:45` 当前只有 `extensions` / `rules` 两个 tab，日志查看需要扩展 popup 的 tab 或 actions surface。
- `src/services/devStorage.ts:23` 使用 localStorage 模拟 web preview 存储，`src/services/mockData.ts:130` 提供 50 条 mock extensions；开发预览也应能生成和展示日志样例。

## 方案选项

1. **后台监听 + 独立 usageLogRepo/store + popup 新增 Logs tab**
   - 优点：安装/卸载/外部启停事件不依赖 popup；数据访问边界清晰；UI 与规则、扩展管理并列，后续可继续增加筛选和导出。
   - 缺点：需要新增 repo、store、类型、后台服务和 UI，改动面中等。
2. **只在 extensionStore 的用户操作路径写日志**
   - 优点：实现最少，容易测试 toggle、batch、undo/redo。
   - 缺点：无法记录浏览器外部或其他扩展触发的启用/禁用，也无法可靠记录安装/卸载；与 TODO 的"安装/卸载历史"不匹配。
3. **只做后台日志，不做 popup UI**
   - 优点：先建立数据基础，UI 改动少。
   - 缺点：用户无法看到或使用日志，不满足"统计使用情况"的可见目标。

## 推荐方案 + 理由

推荐方案 1：新增 `usageLogRepo`、`usageLogStore`、后台监听服务和 popup `LOGS` tab。

理由：TODO 同时要求启用/禁用/安装/卸载历史与统计，事件来源不只来自当前 popup 操作。后台监听能在 service worker 生命周期内集中捕获 `chrome.management` 事件；repo/store 分层延续现有 `extensionsRepo`、`ruleStore` 模式；popup tab 能把日志变成用户可验证的功能，而不是仅存储内部数据。该方案可通过模拟 repo、触发 store 加载、检查 UI 渲染和后台 handler 注册来验证。

## 影响范围

- 改动文件清单（估算）：
  - `src/types/index.ts`：新增 `UsageLogEvent`、`UsageLogStats`、`UsageLogStore` 等类型，约 35 行。
  - `src/services/usageLogRepo.ts`：新增 storage-backed repo，包含追加、读取、清空、裁剪、统计聚合，约 120 行。
  - `src/services/devStorage.ts`：新增开发模式 usage log 存储和 mock 初始化，约 45 行。
  - `src/background/index.ts`：新增 usage log 初始化和 management lifecycle listener 注册，约 55 行。
  - `src/stores/usageLogStore.ts`：新增 Zustand store，负责加载、清空、统计派生，约 80 行。
  - `src/stores/index.ts`：导出新 store，约 2 行。
  - `src/components/popup/UsageLogTab.tsx`：新增日志列表和统计 UI，约 130 行。
  - `src/components/PopupPage.tsx`：新增 `LOGS` tab 和初始化 usage log store，约 35 行。
  - `src/stores/__tests__/usageLogStore.test.ts`：新增 store 测试，约 90 行。
  - `src/services/__tests__/usageLogRepo.test.ts` 或扩展现有 repo 测试：覆盖裁剪、统计、清空，约 100 行。
- 总估算行数：约 690 行。
- 新增依赖：无。
- 影响公开 API / 类型：无 npm/package 公开 API；会新增内部导出的 usage log 类型和 store。

## 验收标准

- [ ] 启用/禁用扩展后，usage log 中新增一条包含 `extensionId`、`extensionName`、`action`、`timestamp`、`source` 的事件。
- [ ] 安装/卸载扩展事件通过后台 management listener 写入日志；卸载事件至少保留 extension id，能拿到名称时保留名称。
- [ ] 日志持久化到 `browser.storage.local`；重新打开 popup 后仍能看到历史记录。
- [ ] web preview 模式使用 `devStorage` 存取 usage log，不调用真实浏览器 extension API。
- [ ] 日志条数有上限裁剪，旧事件超过上限后从最旧记录开始移除。
- [ ] popup 中新增日志入口，能显示最近事件、按 action 汇总的基础统计，以及空状态。
- [ ] 清空日志操作可用，并且清空后列表和统计同步更新。
- [ ] 后台监听和 popup 用户操作不会重复记录同一次启用/禁用事件；如无法完全区分来源，必须在实现中明确去重窗口或来源规则。
- [ ] 所有现有测试通过。
- [ ] lint clean / build success。
- [ ] Playwright 走查通过：关键页面截图无 console.error，验收标准对应交互均有截图。

## 风险

- 事件重复：用户从 popup 调用 `setEnabled` 后，浏览器也可能触发 `onEnabledChanged`。实现时需要统一记录来源，或使用短时间窗口按 `extensionId + action` 去重。回滚方案：临时只保留后台事件记录，移除 store 操作路径写入。
- storage 膨胀：长期记录所有事件会增长 `storage.local` 数据。实现时必须设置最大事件数，例如 500 或 1000，并从最旧事件裁剪。回滚方案：降低上限或只保留统计聚合。
- 卸载事件信息不完整：Chrome/Firefox 对 uninstall 回调信息可能不同，现有 adapter 已把 uninstall 标准化成 id。实现时卸载日志可先记录 id，名称从最近缓存或既有日志中补全，补不到则显示 id。回滚方案：UI 对 unknown name 使用稳定 fallback。
- service worker 生命周期：后台脚本可能被挂起，初始化应幂等，监听注册不依赖 popup。回滚方案：保留 repo/store/UI，暂时只记录 popup 内操作。

回滚方案：删除 usage log repo/store/UI tab 和后台 usage log 初始化；保留在 `storage.local` 中的历史键不会影响现有扩展管理、分组或规则功能，可在后续版本中清理。

## Decisions log

- **2026-05-20**: 初版 spec，决定采用后台监听 + 独立 usage log repo/store + popup Logs tab，确保安装/卸载和外部启停事件也能记录。
