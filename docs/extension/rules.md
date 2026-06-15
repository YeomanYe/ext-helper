# 浏览器扩展规则

> ext-helper 作为**跨浏览器扩展**必须遵守的硬规则。架构全貌见
> [`../architecture/rules.md`](../architecture/rules.md)，通用工程规范见
> [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md)。

## 1. 双运行时契约（dual-runtime）

应用同时跑在两种模式，由 `isDevMode()`（`src/services/mockData.ts`）切换：

- **扩展模式**（`pnpm dev` / 生产）：Plasmo + 真实 `chrome.management.*` 等浏览器 API
- **Web 预览模式**（`pnpm dev:web`）：Vite + `devStorage`（localStorage in-memory mock），**没有任何扩展 API**

**硬规则**：

- 所有数据访问**必须**走 Repository（`src/services/*Repo.ts`），由 repo 内的 `isDevMode()` 分支。
- **禁止**在 component / store 里判断运行模式或直接调浏览器 API —— 否则 web 预览模式会崩。
- 新增依赖浏览器 API 的能力，必须同时给 `devStorage` 补 mock，保证 `pnpm dev:web` 不报错。

## 2. 跨浏览器只走 adapter

- 一切浏览器 API **只能**经 `browserAdapter`（`src/services/browser/adapter.ts`）调用，
  **禁止**在业务代码里裸调 `chrome.*` / `browser.*`。
- 新增浏览器能力 → 先在 adapter 暴露统一方法，再在上层用。

## 3. MV3 / MV2 差异

- Chrome 走 **Manifest V3**（`--target=chrome-mv3`），Firefox 走 **MV2**（`--target=firefox-mv2`）。
- background（MV3 service worker vs MV2 persistent page）、API 可用性差异**收敛进 adapter**，
  不在功能代码里写 `if (chrome) ... else ...`。
- 规则引擎后台逻辑在 `src/background/index.ts`（监听 tab URL 变化 + alarms 触发规则），改它两端都要验。

## 4. 权限纪律（manifest）

- `public/manifest.json` 的 permissions **最小化**：只申请真正用到的（核心 `management`、`tabs`、`alarms`）。
- 新增权限前先问"能不能不加" —— 多余权限拖慢商店审核、吓退用户。
- 改 permissions 必须同步更新 [`../../PRIVACY.md`](../../PRIVACY.md) 与上架材料。

## 5. 路径别名

- `@/*` → `src/*`（Vite / tsconfig，**新代码统一用这个**）
- `~src/*` → `src/*`（Plasmo 兼容，仅保留）

## 6. 图标资产

`assets/` 只需两个文件，Plasmo 自动生成 16/32/48/64/128 各尺寸：

- `icon.png` — 源图标，生产构建直接用
- `icon.development.png` — 同款设计，告诉 Plasmo dev 构建跳过灰度处理
