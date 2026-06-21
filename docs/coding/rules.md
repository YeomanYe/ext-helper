# 编码规则

> 改任何文件都适用。状态/数据流的架构约束见 [`../architecture/rules.md`](../architecture/rules.md)，
> 样式见 [`../ui/rules.md`](../ui/rules.md)。这些由 `eslint.config.js` + pre-commit 强制。

## 类型与 lint

- **类型导入** —— 跨模块类型用 `import type { X }`（eslint `consistent-type-imports`，error）。
- **禁裸 console** —— 只允许 `console.warn` / `console.error`（`no-console`）。
- **少用 any** —— `@typescript-eslint/no-explicit-any`（warn），新代码尽量给准确类型。
- **未用变量** —— 用 `_` 前缀显式标注可忽略（`argsIgnorePattern: ^_`）。

## 命名与组织

- 组件按职责分目录：`src/components/{popup,extension,group,rules,common}/`。
  - `common/` 放跨场景 UI 原语（Button / Input / Switch / ConfirmDialog / Tooltip）。
- 共享 hooks 进 `src/hooks/`。
- 类型集中在 `src/types/`，跨模块共享的导出在那里。
- **路径别名统一用 `@/*`**（→ `src/*`）；`~src/*` 仅为 Plasmo 兼容保留，新代码不要用。

## 测试（vitest）

- 测试文件与源码相邻放 `__tests__/`，命名 `*.test.ts(x)`。
- 本地开发 `pnpm test`（watch）；门禁 / CI 用 `pnpm test:run`（单次）。
- 提交大改动前跑 `pnpm check`（lint + typecheck + test:run + build）。

## 样式

- 只用 `punk-` 设计系统类，**不写魔法色值**，详见 [`../ui/rules.md`](../ui/rules.md)。

## changeset 提交门禁

**改了会进扩展产物的东西（源码 / 入口 / manifest 权限等）→ 提交前先跑 `pnpm changeset`。**
由 pre-commit 的 `scripts/check-changeset.mjs` 强制，没有对应 changeset 就拦下提交。

- **粒度**：一个功能 / 一个用户可见改动一条 changeset，跟着 commit 走，不要攒到发布前。
- **判定逻辑**（白名单减法，避免漏判）：暂存文件**默认都需要 changeset**，
  只对纯文档 / 配置 / 脚本 / `website/` / 依赖清单等放行。所以根目录 `popup.tsx`、
  `resources/`、`package.json` 里的 manifest 权限字段改动都会被拦——它们确实影响用户。
- **bypass**：trivial 改动（typo / 纯文档 / WIP）用
  `CHANGESET_SKIP=1 git commit ...`（只跳过本门禁，lint-staged/typecheck 照跑）；
  `git commit --no-verify` 会跳过全部 hook，慎用。
- 命令：`pnpm changeset`（选 minor/patch + 写一句面向用户的说明）。

发布时由 `pnpm version-packages` 把所有 changeset 汇总进 `CHANGELOG.md` 并升版本号，
细节见 [`../../CONTRIBUTING.md`](../../CONTRIBUTING.md) 的「版本与发布」。

