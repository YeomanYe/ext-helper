---
id: bisect-whitelist
title: 二分调试白名单
status: draft
created: 2026-06-27
updated: 2026-06-27
project_root: /Users/ym/Documents/projects/ext-helper
needs_visual_check: true
needs_video_check: false
---

## 目标

给二分调试加白名单：用户可以把"绝对不能被关"的扩展（密码管理器、输入法、翻译工具等）
排除在二分流程之外，让它们在整个会话期间保持基线状态。白名单同时支持
**全局持久化**（一次设置长期生效）和**启动时临时调整**（本次会话内增减）。

## 现状

二分调试核心实现位于 `src/stores/extensionStore.ts:239` (`startBisect`) 与
`src/stores/bisectUtils.ts:24` (`buildBisectExtensions`)。当前流程：

- `startBisect()` 把所有 enabled 扩展收集为 `candidateIds`（`extensionStore.ts:244-247`），
  没有任何排除机制。
- `buildBisectExtensions()` 对所有 candidate 应用"测试集启用/其余禁用"逻辑，
  非 candidate 保留原状态。
- `BisectSession` 类型（`src/types/index.ts:93-104`）目前不含白名单字段。
- `Preferences` 类型（`src/types/index.ts:106-115`）有 theme/sortBy/aiSettings 等偏好，
  无 bisect 相关字段。
- 启动入口：`ExtensionsActionsMenu.tsx:67-77` 的 `Start Bisect` 菜单项直接触发
  `onStartBisect()`，**无确认对话框**。
- UI 字符串全部硬编码英文（无 i18n 层），dialog 走 `createPortal` 自定义模式
  （参考 `ConfirmDialog`、`AiSettingsDialog`），未引入 shadcn Dialog。
- 自身扩展已在 `browser/adapter.ts:145-152` 过滤；`mayDisable === false` 的扩展
  在 `ExtensionCard` 已被禁用开关。

## 方案选项

1. **持久化偏好 + 启动前对话框（推荐）**
   `Preferences.bisectWhitelist: string[]` 持久存储。`Start Bisect` 时弹出
   白名单确认对话框，默认勾选 = 当前 preferences，用户可临时增减；点 `Start Bisect`
   时把勾选状态写回 preferences 并按该集合启动会话。另外 Actions 菜单加
   `Manage Bisect Whitelist` 项，打开同一对话框的"仅编辑"模式（Save/Cancel）。
   优点：单一数据源（preferences），UI 复用，临时调整天然落到持久化。
   缺点：每次启动都弹对话框，习惯了之后可能略嫌啰嗦——可后续加"don't show again"
   选项缓解，本期不做。

2. **只持久化、无启动对话框**
   纯设置面板管理，启动直接按当前白名单走。
   优点：流程最快。
   缺点：用户每次都得跳到设置面板调整，不符合"启动时也想看一眼当前白名单是哪些"
   的实际使用习惯。

3. **每次会话内独立白名单、不持久化**
   只在 BisectSession 里存白名单，每次启动从空开始。
   优点：实现最简单。
   缺点：用户最常见的"我的输入法/密码管理器永远不要被关"场景反复要重选，体验差。

## 推荐方案 + 理由

采用 **方案 1**。理由：

- 全局白名单覆盖最常见的稳态场景（工具链扩展不参与二分）。
- 启动前对话框承担"临时调整"职责，同时也是"启动前确认"的天然位置——目前
  `Start Bisect` 没有任何确认，加这一步顺手补上。
- 数据源单一（preferences），不在 BisectSession 冗余存白名单，避免会话内变更
  时两边不一致。

## 设计细节

### 数据模型

`src/types/index.ts`：

```ts
interface Preferences {
  // ... 现有字段
  bisectWhitelist?: string[]   // 扩展 ID 列表，未设置时视为空数组
}
```

`BisectSession` 不增加字段；启动时按 preferences 快照过滤即可。
原因：白名单变更应该立即影响"下次启动"，会话进行中变更对当前会话无意义。

### 核心逻辑改动

`src/stores/extensionStore.ts` `startBisect()`：

```ts
const whitelist = new Set(preferences.bisectWhitelist ?? [])
const candidateIds = extensions
  .filter((e) => e.enabled && e.mayDisable && !whitelist.has(e.id))
  .map((e) => e.id)

if (candidateIds.length < 2) {
  // 报错："白名单后可二分的扩展不足 2 个"
  return
}
```

`src/stores/bisectUtils.ts` `buildBisectExtensions()` 无需改动——白名单扩展
不在 `candidateIds` 内，自然走 "非 candidate 保留原状态" 分支。

### UI 改动

**新增组件**：`src/components/popup/BisectWhitelistDialog.tsx`
- props：`mode: "edit" | "start-bisect"`、`open`、`onClose`、`onConfirm(ids)`、
  `extensions`、`initialWhitelist`
- 布局：列表 + 复选框，每行 `[checkbox] [icon] [name]`，已隐藏自身扩展
  和 `mayDisable === false` 的项（这些扩展本来就不会被二分动到，列出来
  会让用户困惑）
- 列表上方可加一个搜索框（如果列表 ≥ 10 项），降低勾选成本
- 按钮：
  - `edit` 模式：`Save` / `Cancel`
  - `start-bisect` 模式：`Start Bisect` / `Cancel`
- 复用 `ConfirmDialog` 的 portal + 样式 token (`punk-*`)

**菜单改动**：`src/components/popup/ExtensionsActionsMenu.tsx`
- `Start Bisect` 项：点击后**不直接 startBisect**，而是 `setShowBisectDialog(true)`
- 新增 `Manage Bisect Whitelist` 项：打开同对话框的 `edit` 模式

**连线**：`PopupPage.tsx`（或当前持有 Actions 菜单状态的组件）
- 持有 `bisectDialogMode: "edit" | "start-bisect" | null`
- onConfirm 时：写 preferences；若是 `start-bisect` 模式，再调用 `startBisect()`

### 边界与错误

- 白名单后 candidates < 2：在对话框底部内联显示
  "Need at least 2 candidates; remove some items from the whitelist."
  禁用 `Start Bisect` 按钮，不弹错误 toast（即时反馈更好）
- 白名单中含已卸载的扩展 ID：列表里直接忽略，preferences 保留（用户可能只是临时关掉了该扩展，重装后白名单自动恢复）
- 白名单为空：等价于现有行为，不影响存量用户

### 字符串（硬编码英文，跟现有 BisectBanner 一致）

- 对话框标题（edit 模式）：`Bisect Whitelist`
- 对话框标题（start-bisect 模式）：`Start Bisect — Whitelist`
- 副标题：`Whitelisted extensions stay in their current state and are excluded from bisect.`
- 菜单项：`Manage Bisect Whitelist`
- 不足 2 个的提示：`Need at least 2 candidates; remove items from the whitelist.`

## 测试计划

**单元测试**（`src/stores/__tests__/bisectUtils.test.ts` / 新建 `extensionStore.test.ts`）：
- startBisect 过滤白名单 ID
- 白名单为空时行为等价于当前实现
- 白名单导致 candidates < 2 时拒绝启动（不创建会话）
- 白名单扩展在 `buildBisectExtensions` 各轮迭代中保持基线状态
- 白名单含已卸载扩展 ID 时不影响其余流程

**组件测试**（`src/components/popup/__tests__/BisectWhitelistDialog.test.tsx`）：
- edit 模式：Save 调用 onConfirm 并传新选择；Cancel 不调用
- start-bisect 模式：候选不足 2 时 `Start Bisect` 按钮 disabled 并显示提示
- 默认勾选状态 = initialWhitelist

**视觉走查**（`needs_visual_check: true`）：
- 对话框深蓝/浅色两种主题下样式
- 列表长度 < 5 / ≥ 10 两种情况
- 候选不足 2 的错误态

## 变更范围估算

- 类型：`src/types/index.ts` 加 1 字段
- store：`src/stores/extensionStore.ts` 改 `startBisect()` 约 10 行
- 新组件：`src/components/popup/BisectWhitelistDialog.tsx` 约 150 行
- 菜单/连线：`ExtensionsActionsMenu.tsx` + `PopupPage.tsx` 共约 30 行
- 测试：3 个测试文件，新增/修改约 200 行
- 文档：CHANGELOG `[Unreleased]` 加一条

预计 ~6 文件 / ~400 行。
