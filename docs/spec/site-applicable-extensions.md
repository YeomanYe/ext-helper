---
id: site-applicable-extensions
title: 当前网站可用扩展识别
status: approved
created: 2026-05-20
updated: 2026-05-20
project_root: /Users/ym/Documents/projects/ext-helper
needs_visual_check: true
---

## 目标

在 popup 的扩展列表中识别当前活动网站，并标记已安装扩展里哪些可能适用于此站点。用户打开 Ext Helper 时，可以直接看到当前域名和每个扩展的适用状态，从而更快决定要启用、禁用或检查哪些扩展。

## 现状

`src/services/browser/adapter.ts:208` 已提供 `getCurrentTabUrl()`，可在扩展运行时读取当前窗口的 active tab URL；`src/services/browser/adapter.ts:56` 到 `src/services/browser/adapter.ts:57` 已把 management API 的 `permissions` 与 `hostPermissions` 映射进 `Extension`。

`src/types/index.ts:3` 到 `src/types/index.ts:22` 的 `Extension` 类型目前只保存扩展基础信息和 host permissions，没有任何“当前网站适用性”的派生字段。`src/rules/domainMatcher.ts:10` 到 `src/rules/domainMatcher.ts:21` 已有 HTTP(S) URL hostname 提取逻辑，`src/rules/domainMatcher.ts:81` 到 `src/rules/domainMatcher.ts:88` 已有按 exact/contains/wildcard/regex 匹配 URL 的工具，但它服务于规则系统，不直接理解 Chrome host permission pattern。

`src/components/popup/ExtensionsTab.tsx:38` 使用 `useFilteredExtensions()` 取得要渲染的扩展列表，`src/components/popup/ExtensionsTab.tsx:178` 到 `src/components/popup/ExtensionsTab.tsx:188` 把每个扩展传给 `ExtensionCard`。`src/components/extension/ExtensionCard.tsx:208` 到 `src/components/extension/ExtensionCard.tsx:234` 已有状态 badge 区域，`src/components/extension/ExtensionCard.tsx:264` 到 `src/components/extension/ExtensionCard.tsx:290` 已在 detail view 展示 host permissions。`src/components/extension/ExtensionDetailsModal.tsx:244` 到 `src/components/extension/ExtensionDetailsModal.tsx:272` 也展示 host permissions，但没有当前网站匹配结果。

`src/services/mockData.ts:85` 到 `src/services/mockData.ts:90` 已有 mock host permission 数据，适合为 `pnpm dev:web` 增加当前网站适用状态预览。

## 方案选项

1. 在 UI 层按当前 URL 即时计算适用性。
   - 优点：不改变持久化数据，不污染 `Extension` 原始模型；失败时只影响展示。
   - 缺点：需要把 current tab URL 状态和 matcher 传入列表/卡片，组件参数会增加。

2. 在 `Extension` 类型上新增 `siteApplicability` 字段，由 store 获取扩展后统一计算。
   - 优点：组件读取简单，过滤和排序后续扩展更直接。
   - 缺点：`Extension` 当前接近 browser management 原始数据模型，把当前 tab 派生状态塞进去会让快照、undo/redo、bisect 和 mock 数据都混入临时 UI 状态。

3. 新建独立 Zustand store 管理 current site 和每个 extension 的匹配结果。
   - 优点：后续若增加“用户使用记录”或云端推荐，可以独立扩展。
   - 缺点：当前需求只需要 host permissions 和当前 URL，新增 store 会比需求复杂，且要处理与扩展列表加载时序的同步。

## 推荐方案 + 理由

推荐方案 1：在 UI 层维护当前 URL/hostname，并用纯函数根据 `extension.hostPermissions` 和 `extension.permissions` 计算适用性，再把结果传给 `ExtensionCard` 和详情弹窗。

理由：当前需求的核心状态是“当前 active tab 上下文 + 已加载扩展列表”的派生结果，不应写入 `Extension` 快照或持久化仓库。该方案可以用单元测试验证 host permission pattern 匹配行为，用组件/Playwright 验证 badge 展示；如果后续要引入用户使用记录，再把纯函数的输入扩展为 usage map 即可。

## 影响范围

- `src/utils/siteApplicability.ts`：新增 host permission pattern 解析、URL hostname 提取复用/封装、适用性结果类型，约 90 行。
- `src/utils/__tests__/siteApplicability.test.ts`：覆盖 `<all_urls>`、`https://*.github.com/*`、根域/子域、非 HTTP(S) URL、无 host permission、有 `activeTab` 权限但无 host permission 等情况，约 100 行。
- `src/components/popup/ExtensionsTab.tsx`：读取当前 tab URL，dev:web 使用稳定 mock URL，计算每个扩展适用性并传给卡片，约 55 行。
- `src/components/extension/ExtensionCard.tsx`：在 compact/card/detail 模式展示 “SITE MATCH / NO MATCH / UNKNOWN” 等小 badge，并把结果传入详情弹窗，约 55 行。
- `src/components/extension/ExtensionDetailsModal.tsx`：展示当前网站适用性解释和匹配到的 host permission，约 35 行。
- `src/services/mockData.ts`：必要时调整 mock host permission 分布或补一个明确匹配当前 mock URL 的样本，约 10 行。

总估算行数：约 345 行。

新增依赖：无。

影响公开 API / 类型：无对外公开 API；可能新增内部 `SiteApplicability` 类型与 `ExtensionCard` / `ExtensionDetailsModal` props。

## 验收标准

- [ ] 在扩展运行模式中打开任意 HTTP(S) 页面后，popup 顶部或扩展列表上下文能显示当前 hostname，非 HTTP(S) 页面显示不可判定状态。
- [ ] host permission 为 `<all_urls>` 的扩展在 HTTP(S) 页面被标记为适用，并显示匹配原因。
- [ ] host permission 为 `https://*.github.com/*` 的扩展在 `https://api.github.com/...` 被标记为适用，在 `https://github.com/...` 的根域匹配行为与实现文档/测试一致。
- [ ] 无 host permission 且只有普通权限的扩展不被误标为适用。
- [ ] `pnpm dev:web` 预览中使用 mock URL 和 mock extensions 能看到至少一个适用、一个不适用、一个未知/不可判定状态。
- [ ] 右键详情或详情弹窗中能看到匹配到的 host permission 或“不适用/无法判定”的原因。
- [ ] 所有现有测试通过
- [ ] lint clean / build success
- [ ] Playwright 走查通过：关键页面截图无 console.error，验收标准对应交互均有截图

## 风险

潜在坑：

- Chrome host permission pattern 与现有 `domainMatcher` 的 wildcard 语义不同，尤其是 `*.example.com` 是否包含根域、scheme/path 是否参与匹配，必须用独立测试钉住行为。
- `activeTab` 权限不等价于长期 host permission，只能作为“不确定/可能需要用户交互”的解释信号，不能直接标记为适用。
- Firefox/Chrome management API 的 `hostPermissions` 字段可能存在差异，空数组应降级为 unknown/no-match，而不是抛错。
- Popup 打开时获取当前 tab URL 失败时，需要展示不可判定状态，不能阻塞扩展列表渲染或影响启用/禁用操作。

回滚方案：移除新增的适用性工具、测试和组件 props，恢复 `ExtensionsTab` 只传原始 `extension` 给 `ExtensionCard`；该改动不涉及数据迁移和持久化 schema，回滚成本低。

## Decisions log

- **2026-05-20**: 初版 spec，决定把当前网站适用性作为 UI 派生状态实现，不写入 `Extension` 持久化模型。
