---
id: config-log-import-export
title: 配置与日志导入导出
status: approved
created: 2026-05-21
updated: 2026-05-21
project_root: /Users/ym/Documents/projects/ext-helper
needs_visual_check: true
---

## 目标

为 Ext Helper 增加配置与日志的导入导出能力。用户可以从 popup 右上角入口导出 Groups、Rules、偏好设置和扩展使用日志，也可以选择备份文件后先预览差异，再确认导入，避免误覆盖本地配置。

## 现状

- `src/components/popup/Header.tsx:201` 定义显示模式切换按钮组，`src/components/popup/Header.tsx:306` 目前右上角只渲染 `ViewModeToggle`，TODO 指定的导入导出入口适合放在这里右侧。
- `src/components/PopupPage.tsx:62` 固定 popup 高度为 600px，`src/components/PopupPage.tsx:63` 负责渲染 Header；新增弹窗需要在该页面或 Header 上方接入状态，避免挤压主内容。
- `src/services/groupsRepo.ts:45` / `src/services/groupsRepo.ts:65` 提供 groups 的读取与整体保存，生产环境已使用 sync storage 分片和索引。
- `src/services/rulesRepo.ts:56` / `src/services/rulesRepo.ts:72` 提供 rules 的读取与整体保存，生产环境同样走 sync storage 分片和索引。
- `src/services/preferencesRepo.ts:16` / `src/services/preferencesRepo.ts:24` 提供偏好设置读取与合并保存，但当前没有整体导入时的 schema 校验边界。
- `src/services/usageLogRepo.ts:117` 可读取日志，`src/services/usageLogRepo.ts:143` 可清空日志；目前没有公开的替换/导入方法，导出日志也需要复用 `UsageLogEvent` 数据结构。
- `src/types/index.ts:24` 定义 `Group`，`src/types/index.ts:51` 定义 usage log action/source，`src/types/index.ts:54` 定义 `UsageLogEvent`，`src/types/index.ts:102` 定义 `Preferences`；导入导出包应基于这些内部类型建立版本化 schema。
- `src/services/devStorage.ts:69` 会把 dev preview 的 extensions/groups/rules/preferences/usageLog 写入 localStorage；导入导出需要兼容 web preview，不应直接调用真实浏览器 API。
- `src/services/browser/adapter.ts:138` / `src/services/browser/adapter.ts:150` 已封装 local storage 读写，`src/services/browser/adapter.ts:161` / `src/services/browser/adapter.ts:173` 已封装 sync storage 读写，可继续由 repo 层间接使用。

## 方案选项

1. **新增 importExport service + Header 图标入口 + 确认弹窗**
   - 优点：导入导出编排集中在 service，UI 只负责文件选择、预览和确认；复用现有 repo 的 fetch/save 方法，兼容生产和 web preview；后续增加云同步或更多数据域时扩展点清晰。
   - 缺点：需要新增 schema、校验、文件读写 UI 和测试，改动面中等。
2. **在 PopupPage 内直接串联各 repo 完成导入导出**
   - 优点：文件数少，入口接入快。
   - 缺点：UI 组件会承担数据编排和校验，难以测试；导入失败时更容易出现部分写入和状态不同步。
3. **先只做导出，不做导入**
   - 优点：数据风险最低，能快速提供备份能力。
   - 缺点：不满足 TODO 的“导入导出”目标，也无法验证备份文件可恢复。

## 推荐方案 + 理由

推荐方案 1：新增版本化 `importExport` service，Header 右上角增加图标按钮打开导入导出弹窗，导入流程拆成“解析文件 -> 预览数据域与数量 -> 用户确认 -> 顺序写入 repo -> 刷新 stores”。

理由：该需求涉及多个持久化域，最重要的可检验风险是导入时不能悄悄覆盖用户数据。把导出包 schema、解析校验、预览摘要和确认后写入集中在 service/store 边界，可以用单元测试验证无效文件、缺字段、版本不匹配、取消导入不写入、确认导入按选择的数据域写入。Header 弹窗入口符合 TODO 指定位置，并能通过 Playwright 验证 UI 预览和确认路径。

## 影响范围

- 改动文件清单（估算）：
  - `src/types/index.ts`：新增 `ImportExportPayload`、`ImportExportPreview`、可选数据域等内部类型，约 45 行。
  - `src/services/importExportService.ts`：新增导出包生成、JSON 解析、schema 校验、预览摘要、确认导入编排，约 180 行。
  - `src/services/usageLogRepo.ts`：新增 `replaceAll` 或等价导入方法，复用现有裁剪和规范化逻辑，约 25 行。
  - `src/stores/importExportStore.ts` 或在现有 UI 流程内新增轻量状态管理：管理解析结果、导入状态、错误和完成提示，约 90 行。
  - `src/components/popup/Header.tsx`：在 `ViewModeToggle` 右侧增加导入导出图标按钮和 props，约 35 行。
  - `src/components/popup/ImportExportDialog.tsx`：新增弹窗、导出按钮、文件选择、预览、数据域勾选和确认导入 UI，约 220 行。
  - `src/components/PopupPage.tsx`：接入弹窗状态，导入成功后刷新 groups/rules/preferences/usage log 相关 store，约 45 行。
  - `src/services/__tests__/importExportService.test.ts`：覆盖导出 schema、无效 JSON、预览、取消不写、确认写入等，约 140 行。
  - `src/stores/__tests__/usageLogStore.test.ts` 或 repo 测试扩展：覆盖日志 replace/import 后统计刷新，约 40 行。
- 总估算行数：约 820 行。
- 新增依赖：无。
- 影响公开 API / 类型：无 npm/package 公开 API；会新增内部导入导出 payload 类型和 service 方法。

## 验收标准

- [ ] 点击 Header 右上角显示模式切换控件右侧的导入导出图标，会打开导入导出弹窗。
- [ ] 导出操作会下载一个 JSON 文件，文件包含版本号、导出时间、Groups、Rules、Preferences，并在 usage log 已可用时包含 UsageLogEvents。
- [ ] 导出的 JSON 不包含扩展管理权限之外的敏感浏览器数据，不包含用户未选择导出的数据域。
- [ ] 选择导入文件后，系统先展示预览摘要，至少包含数据域、条目数量、导出时间和版本兼容性；确认前不写入任何 repo 或 store。
- [ ] 无效 JSON、缺少必需字段、版本不兼容或数据结构不合法时，弹窗显示可理解错误，并且本地数据保持不变。
- [ ] 用户取消导入或关闭弹窗时，不写入 Groups、Rules、Preferences 或 UsageLogEvents。
- [ ] 用户确认导入后，只写入预览中勾选的数据域，并刷新 popup 中对应的 groups、rules、preferences 和 logs 视图。
- [ ] 导入 usage log 时复用现有日志上限和规范化规则，导入后统计与列表同步更新。
- [ ] web preview 模式可导出和导入 mock/devStorage 数据，不调用真实 browser extension API。
- [ ] 所有现有测试通过。
- [ ] lint clean / build success。
- [ ] Playwright 走查通过：关键页面截图无 console.error，验收标准对应交互均有截图。

## 风险

**⚠️ 高风险：本改动涉及用户配置导入与覆盖，确认导入后可能替换 Groups、Rules、Preferences 和 UsageLogEvents。**

- 数据覆盖风险：导入确认后会替换或合并本地配置，若 schema 校验不足或预览不清晰，用户可能误覆盖现有分组、规则和偏好。回滚方案：保留导出功能，暂时禁用导入确认按钮，或只允许导入到预览状态不写入。
- 部分写入风险：Groups、Rules、Preferences、UsageLogEvents 分属不同 repo，某一项写入失败可能造成数据域不一致。回滚方案：导入前先生成本地备份 payload；失败时提示用户用备份恢复，或在实现中按数据域逐项展示成功/失败。
- 版本兼容风险：未来类型变化后旧备份文件可能缺字段。回滚方案：payload 必须带 schema version；不兼容版本只允许导出新备份，不执行导入。
- usage log 依赖风险：TODO 指明日志部分依赖 `extension-usage-log` 的日志数据结构；该 spec 目前已存在且代码已出现 usageLogRepo，但若 stage2 状态不一致，需要以实际 main 分支结构为准。回滚方案：先实现 Groups、Rules、Preferences，日志域显示为不可用并在后续补齐。
- UI 空间风险：popup 宽高有限，Header 右侧增加图标和弹窗可能挤压显示模式控件。回滚方案：将导入导出入口合并进现有 actions 菜单，但保留右上角相邻入口语义。

## Decisions log

- **2026-05-21**: 初版 spec，决定采用版本化 import/export service + Header 图标入口 + 预览确认弹窗，优先防止无预览覆盖本地配置。
- **2026-05-21**: 高风险信号：用户配置导入/覆盖（已记入“风险”区段，但仍 approved）
