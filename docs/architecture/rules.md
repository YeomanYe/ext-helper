# 架构规则

> 架构层**必须遵守**的硬规则总纲。完整背景叙述见
> [`../_archive/legacy/architecture.md`](../_archive/legacy/architecture.md)。

## 分层（依赖只能向下，禁反向）

```
Presentation   React 组件 + Punk 设计系统
   ↓
Application    Zustand stores + 乐观更新
   ↓
Repository     src/services/*Repo.ts —— dev/prod 自动切换的唯一数据入口
   ↓
Service        BrowserAdapter / RuleEngine / Background service
   ↓
Data           chrome.storage（扩展） / localStorage（web 预览）
```

## 单向数据流

```
User Action → Component → Store → Repository → Browser API / devStorage
```

## 硬规则

- **数据访问只走 Repository** —— 一切持久化经 `src/services/*Repo.ts`，component / store **不得**直接碰
  `chrome.storage` / `localStorage`。
- **dev/prod 分支只在 Repository 层** —— `isDevMode()` 判断只出现在 repo，不下沉到 store / component
  （契约细节见 [extension 域 dual-runtime](../extension/rules.md#1-双运行时契约dual-runtime)）。
- **状态不可变** —— store mutation 一律 spread 造新对象，绝不原地改。
- **乐观更新统一入口** —— 状态先改、异步持久化、失败回滚，统一走 `runOptimisticMutation()`
  （`src/stores/optimistic.ts`），不要各 store 自己手写乐观逻辑。
- **undo/redo 用全量快照** —— extensionStore 维护 `history[]` / `future[]` 全量快照，不手写增量 diff。
- **建组原子写入** —— `createGroup(name, color, extensionIds)` 一次写入全部成员，避免竞态。

## 子系统索引（细节在归档文档）

- Bisect（二分定位问题扩展）：`src/stores/bisectUtils.ts` + extensionStore
- 规则引擎（按域名/时间自动启停）：`src/rules/` + `src/background/index.ts`（细则见 [extension 域](../extension/rules.md)）
- Stores：extensionStore / groupStore / ruleStore / uiStore（`src/stores/`）
