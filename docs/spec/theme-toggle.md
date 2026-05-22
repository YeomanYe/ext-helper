---
id: theme-toggle
title: 主题切换
status: approved
created: 2026-05-22
updated: 2026-05-22
project_root: /Users/ym/Documents/projects/ext-helper
needs_visual_check: true
needs_video_check: false
---

## Stage 1 report (2026-05-22)
- 起草自:stage1 cron prompt
- 改动规模估算: 7 文件 / 180 行
- 高风险信号: none
- needs_visual_check: true
- needs_video_check: false
- 关键决定: 复用现有 `uiStore` 的 `theme: "light" | "dark" | "system"` 状态，在 popup 与 `dev:web` 入口共享同一套应用逻辑，并补上首屏主题预置脚本降低 FOUC。

## 目标

新增主题切换入口，用户可以在深色 / 浅色 / 跟随系统三态之间切换，并让 popup 与 `pnpm dev:web` 预览使用同一套主题状态、持久化和应用逻辑。

## 现状

`src/types/index.ts:104` 已定义 `Preferences.theme` 为 `"light" | "dark" | "system"`，`src/types/index.ts:196` 已把 `theme` 和 `setTheme` 暴露到 `UIStore`。

`src/stores/uiStore.ts:9` 的 `applyTheme()` 目前只切换 `document.documentElement.classList` 上的 `dark` class，`src/stores/uiStore.ts:27` 的 `setTheme()` 会保存 preference，`src/stores/uiStore.ts:71` 的 `initializeUIStore()` 会读取并应用 preference。

`src/components/popup/Header.tsx:322` 已有 settings menu，但菜单里只有 `IMPORT` / `EXPORT`，没有主题切换控件。

`src/styles/globals.css:7` 只在 `:root` 定义一套偏深色的 `--punk-*` 变量，`src/styles/globals.css:40` 的 `body` 直接使用这些变量，因此加 `dark` class 目前不会产生可见浅色 / 深色差异。

`src/popup.tsx:4` 与 `src/dev/main.tsx:4` 分别导入同一份 `globals.css`，但 `index.html:3` 的 `head` 没有首屏主题预置脚本，popup HTML 也没有在 React hydration 前同步主题。

## 方案选项

1. 在 `Header` settings menu 中加入三态主题 segmented control，继续由 `uiStore` 管理状态。优点是改动集中、符合现有 settings 入口；缺点是需要调整菜单宽度和键盘可访问性。
2. 新增独立设置页面或 modal 管理主题。优点是未来偏好项扩展空间更大；缺点是为了一个三态开关引入新页面，影响范围过大。
3. 只跟随系统主题，不提供手动切换。优点是最省代码；缺点是不满足 TODO 要求，也无法验证持久化偏好。

## 推荐方案 + 理由

推荐方案 1：在 `Header` 的 settings menu 内新增三态主题切换控件，控件直接读取 `useUIStore((s) => s.theme)` 并调用 `setTheme()`，不新增并行的 theme state。

硬性约束：主题状态必须由 `uiStore` 管理，`Header` 只做展示和派发。

❌ 反例：在 `src/components/popup/Header.tsx` 里用 `React.useState("dark")` 维护本地主题，然后只在点击时改 DOM class，导致 `preferencesRepo` 和导入导出逻辑不知道当前主题。

硬性约束：popup 与 `dev:web` preview 必须共用主题应用逻辑，不为 `src/popup.tsx` 和 `src/dev/main.tsx` 分别写两套分支。

❌ 反例：在 `src/popup.tsx` 里单独写 `chrome.storage` 读取主题，在 `src/dev/main.tsx` 里单独写 `localStorage` 读取主题，绕过 `preferencesRepo` / `devStorage` 的现有分层。

硬性约束：FOUC 处理参考 tab-shelf 的 inline head script 思路，在 React 启动前先给 `document.documentElement` 写入可被 CSS 识别的主题状态。

❌ 反例：只在 `initializeUIStore()` 完成后才调用 `applyTheme()`，使首屏先渲染默认深色变量，再切到浅色或系统主题。

推荐实现上，将 `applyTheme()` 扩展为同时维护 `class="dark"` 与 `data-theme="<light|dark|system>"`，并在 CSS 中用 `:root` / `html.light` 或 `html[data-theme="light"]` 覆盖浅色变量。首屏脚本只负责读取已持久化 theme、解析 `system` 对应的 `prefers-color-scheme`，并设置同一组 DOM 标记；业务状态仍由 `initializeUIStore()` 负责 hydrate。

Decisions log：本机未找到 `/Users/ym/Documents/projects/tab-shelf`，因此本 spec 只固化“inline head script 防 FOUC”这一做法，不要求复制该项目的具体代码。

## 影响范围

- `src/stores/uiStore.ts`：约 35 行。抽出可复用的主题解析 / DOM 应用函数，确保 `setTheme()` 与 `initializeUIStore()` 都维护同一组 DOM 标记，并监听或重新应用 `system` 模式。
- `src/stores/__tests__/uiStore.test.ts`：约 35 行。补充 `data-theme`、浅色 / 深色 / system 应用、保存失败不回滚 UI 状态等断言。
- `src/components/popup/Header.tsx`：约 45 行。新增主题三态控件，复用 `lucide-react` 图标，保证按钮有 `aria-pressed`、`aria-label` 和稳定尺寸。
- `src/styles/globals.css`：约 35 行。补充 light 变量覆盖，确保现有 `punk-*` utility 和基础样式通过 CSS 变量自然切换。
- `src/popup.tsx`：约 10 行。接入或导入共享的首屏主题预置逻辑，不复制业务状态。
- `src/dev/main.tsx` / `index.html`：约 15 行。让 `dev:web` preview 在 React 启动前应用相同主题标记。
- 可能新增 `src/utils/theme.ts` 或 `src/stores/themeDom.ts`：约 5 行到 20 行。仅在能消除 popup/dev 入口重复逻辑时新增。

总估算行数：约 180 行。

新增依赖：无。

影响公开 API / 类型：无新增公开 API；沿用现有 `Preferences.theme` 与 `UIStore.setTheme` 类型。

本 spec 不引入新依赖。

❌ 反例：为了三态按钮引入新的 UI 组件库或 theme manager，或把一个小型 helper 作为外部依赖加入 `package.json`。

## 验收标准

- [ ] Header settings menu 中显示深色 / 浅色 / 跟随系统三态主题切换入口，点击任一项后当前项有明确选中态，且重新打开 popup 后保持上次选择。
- [ ] 主题切换状态由 `useUIStore` 的 `theme` / `setTheme()` 驱动，`preferencesRepo.save({ theme })` 被调用，导入导出 preferences 仍识别 `theme` 字段。
- [ ] popup 和 `pnpm dev:web` preview 使用同一套主题应用逻辑，二者在选择 `light` / `dark` / `system` 时 DOM 标记和主要颜色变量表现一致。
- [ ] 在 `system` 模式下，`prefers-color-scheme: dark` 与 `prefers-color-scheme: light` 分别能得到正确的深色 / 浅色渲染结果。
- [ ] 首屏加载前已设置主题 DOM 标记，浅色偏好下不会先闪出默认深色背景再切换。
- [ ] CSS 浅色变量覆盖主背景、次级背景、边框、主文字、次文字、muted 文字和强调色，主要 popup 区域不出现低对比度文字。
- [ ] `src/stores/__tests__/uiStore.test.ts` 覆盖三态主题应用、持久化调用和初始化 hydrate 场景。
- [ ] 所有现有测试通过。
- [ ] lint clean / build success。
- [ ] Playwright 截图走查通过：关键页面整屏截图（含主页面 / 新弹窗打开态 / 二次确认态）无 console.error 且覆盖验收标准对应状态。

## 风险

潜在坑：当前 `globals.css` 的 `:root` 默认变量是深色，如果只新增 `dark` class 而不新增浅色变量覆盖，UI 实际不会切换。

回滚方案：删除 `Header` 的主题控件和浅色变量覆盖，保留现有 `uiStore` 默认 `system` 行为即可恢复当前外观。

潜在坑：inline head script 如果和 `uiStore.applyTheme()` 使用不同的 DOM 标记，可能出现首屏是浅色、hydrate 后又变深色的二次跳变。

回滚方案：让 inline script 与运行时代码只共享最小约定：`data-theme` 和 `dark` class；若仍有异常，先移除 inline script，保留运行时主题切换。

潜在坑：`system` 模式若不处理系统主题变化，用户切换系统外观后 popup 可能要重新打开才生效。

回滚方案：先接受重新打开后生效，并在后续 TODO 中补充 `matchMedia(...).addEventListener("change")`；本 spec 的最低要求是打开时按系统主题正确渲染。
