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
