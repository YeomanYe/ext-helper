---
id: ai-group-suggestions
title: 大模型快速分组
status: ready-for-review
created: 2026-05-22
updated: 2026-05-22
project_root: /Users/ym/Documents/projects/ext-helper
needs_visual_check: true
needs_video_check: true
---

## Stage 2 report (2026-05-22)
- 实现自:stage2 cron prompt
- worktree: /Users/ym/Documents/projects/ext-helper/.worktrees/ai-group-suggestions
- branch: todo/ai-group-suggestions
- commits: 1
- 改动文件: 13(src/types/index.ts, src/services/preferencesRepo.ts, src/services/devStorage.ts, src/services/aiProvider.ts, src/services/groupSuggestionService.ts, src/components/group/GroupEditorPanel.tsx, src/components/group/GroupExtensionPicker.tsx, src/components/group/GroupModal.tsx, src/components/popup/Header.tsx, src/services/importExportService.ts, src/services/__tests__/aiProvider.test.ts, src/services/__tests__/groupSuggestionService.test.ts, src/services/__tests__/importExportService.test.ts)
- 关键决定: 在 settings menu 内新增 AI 设置弹窗；`importExportService` 额外脱敏 AI 设置，避免 API key/model/base URL 进入导出 payload。
- needs-rework 兜底: 非 needs-rework，本次按 approved spec 实现。
- 验证: `pnpm exec vitest --run src/services/__tests__/aiProvider.test.ts src/services/__tests__/groupSuggestionService.test.ts src/services/__tests__/importExportService.test.ts` 通过；`npx tsc --noEmit` 仍被既有非本次文件错误阻断，本次改动文件经 scoped filter 无类型错误。

## Stage 1 report (2026-05-22)
- 起草自:stage1 cron prompt
- 改动规模估算: 12 文件 / 520 行
- 高风险信号: external-ai-provider/secret-storage/privacy/public-type-change
- needs_visual_check: true
- needs_video_check: true
- 关键决定: 先抽出可测试的 AI provider 与推荐服务，再把机器人按钮接入现有 GroupModal 创建/更新链路。
- 风险:外部模型调用、API Key 本地保存、扩展元数据发送边界、偏好类型扩展(已记入下文「风险」区段,但仍 approved)

## 目标

在创建与更新分组面板中加入一个机器人图标按钮，用户点击后可以根据当前分组目标和扩展元数据快速得到候选扩展建议，并一键把建议勾选/加入当前分组。模型配置支持本地模型与远程模型，popup 与 `pnpm dev:web` 预览模式都能走同一套 UI 与状态逻辑。

## 现状

`src/components/group/GroupModal.tsx:45` 已用 `isCreateMode` 同时承载新建分组与编辑已有分组，`src/components/group/GroupModal.tsx:137` 的 `handleToggleMembership` 是当前唯一的成员增删入口。

`src/components/group/GroupEditorPanel.tsx:109` 到 `src/components/group/GroupEditorPanel.tsx:142` 只包含分组名称输入、搜索框和筛选器，没有 AI 建议入口或异步状态展示。

`src/components/group/GroupExtensionPicker.tsx:92` 到 `src/components/group/GroupExtensionPicker.tsx:130` 负责渲染扩展候选网格，但当前只有 `isInGroup` 与 enabled 状态，没有推荐状态、推荐理由或批量应用建议的视觉表达。

`src/types/index.ts:104` 到 `src/types/index.ts:110` 的 `Preferences` 只包含 theme、compactMode、showDisabled、sortBy、viewMode；`src/services/preferencesRepo.ts:8` 到 `src/services/preferencesRepo.ts:13` 的持久化类型也没有 AI provider 配置。

`/Users/ym/Documents/projects/ai-bookmark/src/lib/ai.ts:18` 到 `/Users/ym/Documents/projects/ai-bookmark/src/lib/ai.ts:41` 已实现 Chrome 本地模型探测与 provider fallback；`/Users/ym/Documents/projects/ai-bookmark/src/lib/ai.ts:149` 到 `/Users/ym/Documents/projects/ai-bookmark/src/lib/ai.ts:213` 已实现 OpenAI compatible 与 Anthropic compatible 的调用分发；`/Users/ym/Documents/projects/ai-bookmark/src/lib/storage.ts:22` 到 `/Users/ym/Documents/projects/ai-bookmark/src/lib/storage.ts:31` 给出了 provider 默认配置结构。

## 方案选项

1. 在 `GroupModal` 内直接写模型调用与推荐 UI。优点是改动集中、上线快；缺点是组件会混入 provider、prompt、解析和错误处理，后续测试困难，也会让创建/编辑两种模式继续膨胀。

2. 新增 `aiProvider` / `groupSuggestionService` / `aiPreferences` 这类独立模块，`GroupModal` 只负责触发、展示和应用建议。优点是接近现有 repository/store 分层，便于单测 provider 解析、prompt payload 和失败路径；缺点是初次改动文件数更多。

3. 只接远程 OpenAI compatible，不做本地模型和 Anthropic compatible。优点是实现最小；缺点是违反 TODO hints 的本地/远程支持要求，也丢失 `ai-bookmark` 已验证的 provider 抽象经验。

## 推荐方案 + 理由

推荐方案 2：把 AI 能力拆成可测试服务层，UI 只消费 `suggestedExtensionIds`、`reasons`、`loading/error` 和应用动作。可检验点是：provider 单测不需要渲染 React，GroupModal 单测可以 mock service 返回固定建议，创建模式与编辑模式都通过现有 `handleToggleMembership` / `onAddExtension` / `onRemoveFromGroup` 路径落地，不新增第二套成员写入逻辑。

TODO hint「在创建/更新分组面板增加机器人图标按钮」应落实为 `GroupEditorPanel` 或其直接子组件里的 icon button，并同时覆盖 create 与 edit 模式。
❌ 反例：只在 `src/components/popup/Header.tsx` 的 settings menu 里放一个 AI 入口，或只在新建分组时显示按钮，编辑已有分组时没有入口。

TODO hint「点击后根据扩展名称、描述、权限和当前分组目标推荐候选扩展」应落实为结构化 prompt payload，至少包含 `Extension.name`、`Extension.description`、`Extension.permissions`、`Extension.hostPermissions`、当前 `editName`、当前分组已有成员 id 和候选 id，并要求模型只返回 extension id JSON。
❌ 反例：只把扩展名称拼成一段自然语言发给模型，或让模型返回扩展名称后用字符串包含匹配，导致重名扩展和权限信息完全失效。

TODO hint「设置中支持本地模型和远程模型」应复用现有右上角 settings menu 的交互位置，增加 AI 设置面板或弹窗，保存 provider 类型、base URL、model name、API key 和连接测试结果；本地模型走 Chrome Prompt API 探测，远程模型至少支持 OpenAI compatible，优先预留 Anthropic compatible 枚举。
❌ 反例：把 API key 写死在源码、`.env` 或 mock 数据里，或者只提供一个文本框填写完整请求 URL 而没有 provider 类型和 model name。

TODO hint「大模型接入逻辑借鉴 /Users/ym/Documents/projects/ai-bookmark」应移植思路而非直接跨仓库 import：参考 `detectChromeLocalAiStatus`、`promptOpenAiCompatible`、`promptAnthropicCompatible`、`testAiProvider` 的接口边界，在本项目内用本项目类型重写。
❌ 反例：从 `/Users/ym/Documents/projects/ai-bookmark/src/lib/ai.ts` 做相对路径 import，或整文件复制后保留 bookmark/folder 命名和无关 `DraftBookmark` 类型。

## 影响范围

- `src/types/index.ts`：新增 AI provider、AI 设置、推荐结果相关类型，约 60 行。
- `src/services/preferencesRepo.ts`：扩展偏好持久化字段并保持旧数据兼容，约 25 行。
- `src/services/devStorage.ts`：让 `dev-preferences` 支持 AI 设置，约 25 行。
- `src/services/aiProvider.ts`（新增）：本地模型探测、远程模型调用、连接测试、JSON 解析，约 160 行。
- `src/services/groupSuggestionService.ts`（新增）：构造扩展推荐 prompt、校验返回 id、生成推荐理由 fallback，约 110 行。
- `src/components/group/GroupEditorPanel.tsx`：增加机器人图标按钮、loading/disabled 状态和错误/结果提示入口，约 45 行。
- `src/components/group/GroupExtensionPicker.tsx`：展示推荐候选高亮、理由 tooltip/短标签、批量应用建议状态，约 55 行。
- `src/components/group/GroupModal.tsx`：管理建议请求状态，并把建议应用到创建/编辑模式的现有成员更新路径，约 90 行。
- `src/components/popup/Header.tsx` 或新增 settings dialog 组件：在 settings menu 中接入 AI 设置与连接测试，约 80 行。
- `src/services/__tests__/aiProvider.test.ts`（新增）：覆盖本地/远程 provider、解析失败、缺配置，约 80 行。
- `src/services/__tests__/groupSuggestionService.test.ts`（新增）：覆盖 prompt payload、无效 id 过滤、空结果，约 70 行。
- `src/components/group/__tests__` 或现有测试位置：覆盖按钮触发和应用建议的主要 UI 行为，约 80 行。

总估算行数：约 520 行。

新增依赖：无，优先使用浏览器 `fetch`、Chrome Prompt API 和现有 `lucide-react` 图标。
❌ 反例：为了请求模型新增 `openai`、`@anthropic-ai/sdk` 或任意代理 SDK，导致扩展包体和权限面增加。

影响公开 API / 类型：会扩展 `Preferences`、`ImportExportPreferences` 和内部 AI provider 类型；不改变现有 `GroupStore.createGroup` / `updateGroup` / `addToGroup` / `removeFromGroup` 的调用语义。

范围限制：推荐功能只能建议和应用已安装扩展 id，不负责创建新扩展、不自动改分组名称、不自动启用/禁用扩展。
❌ 反例：模型返回一个不存在的扩展名称时自动创建占位项，或在应用建议时顺手调用 `toggleExtension` 改变 enabled 状态。

## 验收标准

- [ ] 创建分组弹窗和更新分组弹窗都显示机器人图标按钮，按钮有 loading、disabled 和失败状态，且不会挤压 `GROUP_NAME` 输入框和 `SEARCH & FILTER` 区域。
- [ ] 点击机器人按钮时，推荐请求 payload 包含扩展名称、描述、permissions、hostPermissions、当前分组名称、当前成员和候选扩展 id；模型返回不存在的 id 会被过滤且不会抛到 UI 崩溃。
- [ ] 创建模式下应用建议后，建议扩展进入 `selectedExtensions`，点击 `CONFIRM` 后通过现有 `createGroup(name, color, extensionIds)` 保存。
- [ ] 编辑模式下应用建议后，通过现有 `onAddExtension` / `onRemoveFromGroup` 路径更新成员，不绕过 `groupStore` 的乐观更新和 rollback 机制。
- [ ] 设置入口支持本地模型与远程模型配置；本地模型能显示 Chrome Prompt API 可用/不可用状态，远程模型能保存 base URL、API key、model name 并执行连接测试。
- [ ] API key 只保存到浏览器本地存储或 dev preview 的 `dev-preferences`，不会写入源码、日志、导出文件预览文本或 console 输出。
- [ ] 远程模型请求失败、返回非 JSON、返回空建议时，UI 显示可恢复错误，已有分组成员选择不被清空。
- [ ] `pnpm dev:web` 预览模式可配置 provider 并触发建议流程；没有真实 Chrome Prompt API 时本地模型路径显示不可用而不是报错白屏。
- [ ] 所有现有测试通过
- [ ] lint clean / build success
- [ ] Playwright 截图走查通过：关键页面整屏截图（含主页面 / 新弹窗打开态 / 二次确认态）无 console.error 且覆盖验收标准对应状态
- [ ] Playwright 录屏走查通过：主交互链路录屏覆盖（从入口操作到结果可见的端到端流程）

## 风险

**⚠️ 高风险：本改动涉及外部 AI provider、API Key 本地保存、扩展元数据发送边界和偏好类型扩展。**

远程模型会接收扩展名称、描述、权限和 hostPermissions，这些信息可能暴露用户安装扩展画像。回滚方案：保留 settings 中的 provider 配置但关闭机器人入口，或让推荐服务在 provider 未启用时直接返回空建议。

API key 存储必须限定在本地浏览器存储和 dev preview localStorage，不应进入 import/export payload、日志或错误消息。回滚方案：移除远程 provider UI，只保留 Chrome 本地模型检测路径。

Chrome Prompt API 仍可能在不同浏览器版本中不可用或接口名变化。回滚方案：本地模型检测失败时降级为 disabled 状态，并提示切换远程 provider。

模型返回不可信，必须校验 JSON、过滤未知 id、限制建议数量，并且不能直接执行启用/禁用扩展这类破坏性动作。回滚方案：建议结果只做高亮，不自动应用。

本次 stage1 仅读了 12 个相关文件，未通读整个 `src/`；如果项目已有隐藏设置页或未被 grep 命中的 provider 约定，stage2 需要优先复查再实现。

Decisions log：hint 均已有可执行反例；没有需要标记为「无有意义反例可举」的 hint。

Decisions log(stage2)：额外修改 `src/services/importExportService.ts`，原因是验收标准要求 API key 不进入导出文件预览文本或导出 payload；该文件不在原影响范围内，但属于同一隐私边界。
