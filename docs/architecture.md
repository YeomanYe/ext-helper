# 浏览器扩展管理插件 - 架构文档

## 1. 项目概述

### 1.1 项目名称
**ExtHelper** - 浏览器扩展管理插件

### 1.2 项目定位
一个跨浏览器的扩展管理工具，提供扩展的启用/禁用、分组管理、撤销/重做、Bisect 调试、规则自动化等功能，统一管理用户安装的所有浏览器扩展。

### 1.3 目标用户
- 需要管理大量浏览器扩展的高级用户
- 开发者需要快速切换扩展状态和定位问题扩展
- 用户希望对扩展进行分类管理和自动化管理

---

## 2. 技术架构

### 2.1 技术栈

| 类别 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | Plasmo 0.90.x | 浏览器扩展开发框架（声明式 Manifest、跨浏览器、Live-reloading） |
| 预览 | Vite 5.x | Web 预览模式开发服务器 |
| 前端 | React 18 | UI框架 |
| 包管理 | pnpm | 高效的包管理 |
| 状态管理 | Zustand 4.x | 轻量级状态管理 |
| 样式 | Tailwind CSS 3.x | 原子化CSS框架（Punk 赛博朋克主题） |
| 图标 | Lucide React | 图标库 |
| 测试 | Vitest | 单元测试框架 |
| 类型 | TypeScript 5.x | 类型系统 |

### 2.2 双运行时模式

项目支持两种运行模式，通过 `isDevMode()` 自动检测：

| 模式 | 命令 | 说明 |
|------|------|------|
| 扩展模式 | `pnpm dev` | Plasmo 框架，使用真实 `chrome.management.*` API |
| Web 预览模式 | `pnpm dev:web` | Vite 开发服务器（端口 4173），使用 `devStorage`（localStorage）+ mock 数据 |

### 2.3 浏览器兼容性

| Chrome | Firefox | Edge |
|--------|---------|------|
| 120+ | 121+ | 120+ |

**兼容性策略**：
- 自定义 `browserAdapter` 跨浏览器抽象层
- 支持 Chrome、Firefox、Edge
- 遵循 Manifest V3

### 2.4 项目结构

```
ext-helper/
├── src/
│   ├── components/           # React组件
│   │   ├── common/          # 通用组件 (Button, Switch, Input, ConfirmDialog)
│   │   ├── extension/       # 扩展组件 (ExtensionCard, ExtensionList, ExtensionContextMenu, ExtensionDetailsModal)
│   │   ├── group/           # 分组组件 (GroupModal, GroupsBar, GroupChips, GroupEditorPanel, GroupExtensionPicker, ...)
│   │   ├── popup/           # Popup页面组件 (Header, Footer, SearchBar, ExtensionsActionsMenu, BisectBanner)
│   │   ├── rules/           # 规则组件 (RuleManager, RuleList, RuleCard, RuleEditor, ConditionBuilder, ActionBuilder, RuleBadges)
│   │   └── PopupPage.tsx    # 主页面入口组件
│   ├── stores/              # Zustand状态管理
│   │   ├── extensionStore.ts    # 扩展状态（含 undo/redo + bisect）
│   │   ├── groupStore.ts        # 分组状态
│   │   ├── ruleStore.ts         # 规则状态
│   │   ├── uiStore.ts           # UI偏好状态
│   │   ├── optimistic.ts        # 乐观更新工具
│   │   ├── bisectUtils.ts       # Bisect 工具函数
│   │   └── extensionStoreUtils.ts # 扩展 Store 工具函数
│   ├── services/            # 数据访问层（Repository 模式）
│   │   ├── browser/         # 浏览器适配层
│   │   │   └── adapter.ts   # 跨浏览器 API 抽象
│   │   ├── extensionsRepo.ts    # 扩展数据仓库
│   │   ├── groupsRepo.ts       # 分组数据仓库
│   │   ├── rulesRepo.ts        # 规则数据仓库
│   │   ├── preferencesRepo.ts  # 偏好数据仓库
│   │   ├── devStorage.ts       # 开发模式存储（localStorage）
│   │   └── mockData.ts         # Mock 数据（20个扩展 + 分组 + 50条规则）
│   ├── rules/               # 规则引擎
│   │   ├── types.ts         # 规则类型定义
│   │   ├── ruleEngine.ts    # 规则引擎核心
│   │   ├── domainMatcher.ts # 域名匹配器
│   │   └── constants.ts     # 规则常量
│   ├── background/          # 后台服务
│   │   └── index.ts         # 规则自动执行后台脚本
│   ├── hooks/               # 自定义 Hooks
│   │   ├── useClickOutside.ts
│   │   └── useContextMenuPosition.ts
│   ├── types/               # TypeScript类型定义
│   ├── utils/               # 工具函数
│   └── styles/              # 全局样式（Punk 设计系统）
├── docs/                     # 文档
├── vite.config.ts           # Vite 配置（Web 预览模式）
├── tailwind.config.ts       # Tailwind 配置（Punk 主题）
├── package.json
└── tsconfig.json
```

### 2.5 路径别名

| 别名 | 目标 | 使用场景 |
|------|------|----------|
| `@/*` | `src/*` | Vite / tsconfig |
| `~src/*` | `src/*` | Plasmo 兼容 |

---

## 3. 核心架构设计

### 3.1 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                        │
│          (React Components + Tailwind CSS + Punk Theme)      │
├─────────────────────────────────────────────────────────────┤
│                     Application Layer                         │
│              (Zustand Stores + Optimistic Updates)           │
├─────────────────────────────────────────────────────────────┤
│                     Repository Layer                          │
│     (extensionsRepo / groupsRepo / rulesRepo / preferencesRepo) │
├─────────────────────────────────────────────────────────────┤
│                      Service Layer                           │
│    (BrowserAdapter / devStorage / RuleEngine / Background)   │
├─────────────────────────────────────────────────────────────┤
│                       Data Layer                             │
│    (chrome.storage / chrome.management / localStorage)       │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 跨浏览器抽象层

```typescript
// src/services/browser/adapter.ts
const browserAdapter = {
  // 环境检测
  detectBrowser(): BrowserType;
  isManifestV3(): boolean;

  // 扩展管理 API
  getExtensions(): Promise<Extension[]>;
  setExtensionEnabled(id: string, enabled: boolean): Promise<void>;
  uninstallExtension(id: string): Promise<void>;
  openOptionsPage(id: string): Promise<void>;

  // 存储 API
  getStorage(key: string): Promise<any>;
  setStorage(key: string, value: any): Promise<void>;

  // 事件监听
  onExtensionInstalled(callback): () => void;
  onExtensionUninstalled(callback): () => void;
  onExtensionEnabledChanged(callback): () => void;

  // Tab API
  getCurrentTabUrl(): Promise<string | null>;
  getCurrentTabId(): Promise<number | null>;

  // Alarms API
  createAlarm(name, options): Promise<void>;
  clearAlarm(name): Promise<void>;

  // Messaging API
  sendMessage(message, callback?): void;
}
```

### 3.3 Repository 模式

所有 Store 通过 Repository 访问数据，Repository 根据 `isDevMode()` 分支到不同的后端：

```
Store → Repository → isDevMode() ?
                       ├─ true  → devStorage (localStorage + mock 数据)
                       └─ false → browserAdapter (chrome.* API)
```

| Repository | 职责 |
|------------|------|
| `extensionsRepo` | 扩展 CRUD + Bisect 会话持久化 |
| `groupsRepo` | 分组 CRUD |
| `rulesRepo` | 规则 CRUD |
| `preferencesRepo` | UI 偏好读写 |

### 3.4 状态管理架构

```
┌─────────────────────────────────────────────────────────────┐
│                     ExtensionStore                          │
│  - extensions[], loading, error                            │
│  - filter, searchQuery, sortBy                             │
│  - history[], future[] (undo/redo 快照)                    │
│  - canUndo, canRedo, undoCount, redoCount                  │
│  - bisectSession (active, phase, candidates, results)      │
│  - fetchExtensions(), toggleExtension()                    │
│  - setExtensionsEnabled(), removeExtension()               │
│  - undoExtensions(), redoExtensions()                      │
│  - startBisect(), markBisectGood(), markBisectBad()       │
│  - cancelBisect(), finishBisectRestore()                  │
├─────────────────────────────────────────────────────────────┤
│                      GroupStore                             │
│  - groups[]                                               │
│  - activeGroupId, expandedGroups, draggedExtensionId       │
│  - createGroup(), deleteGroup(), renameGroup()            │
│  - updateGroup(), addToGroup(), removeFromGroup()          │
├─────────────────────────────────────────────────────────────┤
│                      RuleStore                              │
│  - rules[], loading, error                                │
│  - fetchRules(), createRule(), updateRule()                │
│  - deleteRule(), toggleRule(), duplicateRule()             │
├─────────────────────────────────────────────────────────────┤
│                       UIStore                                │
│  - theme ('light'|'dark'|'system'), viewMode               │
│  - compactMode, showDisabled, lastUpdate                   │
│  - setTheme(), setViewMode()                              │
│  - toggleCompactMode(), toggleShowDisabled()              │
└─────────────────────────────────────────────────────────────┘
```

### 3.5 乐观更新模式

所有 Store 的异步操作使用 `runOptimisticMutation()` 统一模式：

```typescript
// src/stores/optimistic.ts
async function runOptimisticMutation(set, get, {
  snapshot,   // 保存当前状态快照
  apply,      // 立即应用新状态（乐观）
  persist,    // 异步持久化
  rollback,   // 持久化失败时回滚
  onError     // 错误处理
})
```

### 3.6 Bisect 系统

二分法定位问题扩展（`src/stores/bisectUtils.ts`）：

1. 将所有启用的扩展作为候选集
2. 将候选集分成两半：`currentTestIds`（保持启用）和 `parkedIds`（禁用）
3. 用户标记 Good → 问题在 `parkedIds` 中，Bad → 问题在 `currentTestIds` 中
4. 重复直到候选集只剩1个
5. 会话持久化到 storage，支持弹窗关闭后恢复

### 3.7 规则引擎

```
┌──────────────────────────────────────────┐
│           RuleEngine                     │
│  - evaluateDomainConditions()            │
│  - evaluateScheduleConditions()          │
│  - evaluateConditions()                  │
│  - executeActions()                      │
│  - recordTrigger()                       │
├──────────────────────────────────────────┤
│         DomainMatcher                    │
│  - exact, contains, wildcard, regex      │
├──────────────────────────────────────────┤
│       RuleBackgroundService              │
│  - 监听 tab URL 变化 → 检查域名规则     │
│  - 监听 alarms → 检查时间规则           │
│  - 接收消息 → 手动触发规则              │
└──────────────────────────────────────────┘
```

---

## 4. 数据流设计

### 4.1 单向数据流

```
User Action → Component → Store → Repository → Browser API / devStorage
                ↑                                        │
                └──────────── State Update ←────────────┘
```

### 4.2 乐观更新数据流

```
User Action → Store: snapshot + apply（立即更新 UI）
                         → Repository.persist()
                              ├─ 成功: 确认状态
                              └─ 失败: rollback（恢复快照）
```

### 4.3 关键数据流

1. **加载扩展列表**
   ```
   Popup打开 → fetchExtensions()
   → extensionsRepo.fetchAll()
   → isDevMode() ? devStorage : browserAdapter.getExtensions()
   → 更新Store → 渲染UI
   ```

2. **启用/禁用扩展 (乐观更新)**
   ```
   用户点击 → toggleExtension(id)
   → 保存 history 快照
   → 立即更新 Store 状态
   → extensionsRepo.setEnabled()
   → 失败则回滚 + 恢复 history
   ```

3. **Bisect 调试**
   ```
   Start Bisect → 保存 baseline → 分割候选集 → 应用半禁用
   → Good/Bad → 缩小候选集 → 再次分割 → 重复
   → Resolved → 显示嫌疑扩展 → Restore 恢复原始状态
   ```

4. **规则自动触发**
   ```
   Tab URL 变化 → RuleBackgroundService.checkDomainRules()
   → RuleEngine.evaluateConditions() → executeActions()

   Alarm 定时器 → checkTimeRules() → evaluateScheduleConditions() → executeActions()
   ```

---

## 5. 关键技术决策

### 5.1 为什么选择 Plasmo？

| 特性 | 优势 |
|------|------|
| 声明式 Manifest | package.json 中定义，无需手写 manifest.json |
| 跨浏览器 | 内置 Chrome/Firefox 支持 |
| Live-reloading | 开发时自动重载 |
| 丰富生态 | TypeScript、React 开箱即用 |

### 5.2 为什么选择 Zustand？

| 特性 | 优势 |
|------|------|
| 轻量 | 无 Context.Provider 嵌套 |
| 简洁 | 极少的样板代码 |
| 异步原生 | 内置异步支持 |
| TypeScript | 优秀的类型推断 |
| 直接访问 | `useStore.getState()` 可在组件外使用 |

### 5.3 为什么选择 Repository 模式？

| 特性 | 优势 |
|------|------|
| 解耦 | Store 不直接依赖浏览器 API |
| 可测试 | 通过 devStorage 独立测试 |
| 双模式 | dev/prod 切换透明 |
| 单一职责 | 数据访问逻辑集中 |

---

## 6. 开发模式支持

### 6.1 Web 预览模式

`pnpm dev:web` 启动 Vite 开发服务器（端口 4173），使用 `devStorage`（localStorage 后端）+ mock 数据模拟浏览器扩展 API。

### 6.2 Mock数据

```typescript
// src/services/mockData.ts
export const MOCK_EXTENSIONS: Extension[]  // 20个模拟扩展
export const MOCK_GROUPS: Group[]          // 多个模拟分组
export const MOCK_RULES: Rule[]            // 50条模拟规则

export function isDevMode(): boolean {
  // 检测是否在浏览器扩展环境中运行
}
```

### 6.3 devStorage

```typescript
// src/services/devStorage.ts
class DevStorage {
  // 内存 + localStorage 持久化
  getExtensions() / setExtensions()
  getGroups() / setGroups()
  getRules() / setRules()
  getPreferences() / setPreferences()
  getBisectSession() / setBisectSession()
}
```

---

## 7. 安全设计

### 7.1 权限

```json
{
  "permissions": ["management", "storage", "tabs", "alarms"],
  "host_permissions": ["<all_urls>"]
}
```

- `management` - 管理扩展（必需）
- `storage` - 持久化数据（必需）
- `tabs` - 监听 Tab URL（规则系统）
- `alarms` - 定时调度（规则系统）
- `<all_urls>` - 域名匹配（规则系统）

### 7.2 数据安全

- 本地存储优先，不收集用户数据
- 扩展 ID 和名称本地处理，不上传
- 用户偏好存储在 chrome.storage.local

---

## 8. 性能设计

### 8.1 性能目标

| 指标 | 目标值 |
|------|--------|
| Popup打开时间 | < 200ms |
| 扩展列表渲染 | < 100ms |
| 启用/禁用响应 | < 50ms (乐观更新) |

### 8.2 优化策略

1. **乐观更新** - 操作立即响应，后台异步同步
2. **React.memo** - ExtensionCard 等高频组件使用 memo 避免重渲染
3. **useMemo** - 过滤/排序使用 useMemo 缓存计算结果
4. **useCallback** - 事件处理函数使用 useCallback 稳定引用
5. **状态持久化** - 视图模式等偏好本地缓存
6. **快照克隆** - 使用浅拷贝 + spread 而非深拷贝保证不可变性

---

## 9. 总结

本架构采用**分层 + Repository + 适配器**模式：
- **Presentation** → React + Punk Design System
- **Application** → Zustand + Optimistic Updates
- **Repository** → 统一数据访问，dev/prod 自动切换
- **Service** → BrowserAdapter + RuleEngine + Background Service
- **Data** → chrome.storage / localStorage

核心设计模式：乐观更新、快照式 undo/redo、二分法 bisect、条件组规则引擎。
