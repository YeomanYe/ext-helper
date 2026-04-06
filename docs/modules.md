# 模块设计文档

## 1. 模块概览

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              ExtHelper                                    │
├───────────────┬───────────────┬───────────────┬──────────────────────────┤
│   Extension   │     Group     │    Rules      │       Popup UI           │
│   Management  │   Management  │   Automation  │                          │
├───────────────┼───────────────┼───────────────┼──────────────────────────┤
│ ExtensionCard │ GroupModal    │ RuleManager   │ Header + SearchBar       │
│ ExtensionList │ GroupsBar     │ RuleEditor    │ Footer                   │
│ ContextMenu   │ GroupChips    │ RuleList      │ ExtensionsActionsMenu    │
│ DetailsModal  │ EditorPanel   │ RuleCard      │ BisectBanner             │
│               │ ExtPicker     │ ConditionBldr │ PopupPage (Tab 导航)     │
│               │               │ ActionBuilder │                          │
├───────────────┴───────────────┴───────────────┴──────────────────────────┤
│                            Services Layer                                │
│   extensionsRepo │ groupsRepo │ rulesRepo │ preferencesRepo │ devStorage │
├──────────────────────────────────────────────────────────────────────────┤
│                          Stores (Zustand)                                │
│   extensionStore │ groupStore │ ruleStore │ uiStore │ optimistic         │
├──────────────────────────────────────────────────────────────────────────┤
│                         Browser Adapter                                  │
│   chrome.management │ chrome.storage │ chrome.tabs │ chrome.alarms      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 核心模块

### 2.1 ExtensionModule（扩展管理模块）

**职责**：获取、过滤、操作浏览器扩展

#### 2.1.1 扩展卡片组件

```typescript
// src/components/extension/ExtensionCard.tsx
interface ExtensionCardProps {
  extension: Extension
  onToggle: (id: string) => void
  onOpenOptions?: (id: string) => void
  onRemove?: (id: string) => void
  disableEnableControls?: boolean
  disableRemove?: boolean
  viewMode?: ViewMode  // 'compact' | 'card' | 'detail'
  className?: string
}
```

**功能**：
- 三种视图模式：
  - **Compact**：方形卡片，图标+名称，点击切换状态
  - **Card**：水平列表项，图标+名称+描述+版本+开关
  - **Detail**：完整信息卡片，含权限列表、操作按钮、安装类型
- 右键菜单（通过 ExtensionContextMenu）
- 禁用状态降低透明度
- 使用 `React.memo` 优化渲染

#### 2.1.2 右键菜单组件

```typescript
// src/components/extension/ExtensionContextMenu.tsx
interface ExtensionContextMenuProps {
  show: boolean
  menuRef: React.RefObject<HTMLDivElement | null>
  menuPosition: { top: number; left: number }
  menuWidth: number
  extension: { enabled: boolean; optionsUrl: string | null }
  disableEnableControls: boolean
  disableRemove: boolean
  onToggle: () => void
  onOpenOptions?: () => void
  onRemove: () => void
  onShowDetails: () => void
  onClose: () => void
}
```

**功能**：
- 4个菜单项：ENABLE/DISABLE、OPTIONS（条件显示）、DETAILS、REMOVE
- 使用 `createPortal` 渲染到 `document.body`
- 使用 `useClickOutside` 和 `useContextMenuPosition` hooks

#### 2.1.3 扩展详情弹窗

```typescript
// src/components/extension/ExtensionDetailsModal.tsx
interface ExtensionDetailsModalProps {
  show: boolean
  extension: Extension
  onClose: () => void
  onOpenOptions?: () => void
}
```

**功能**：
- 显示扩展图标、名称、版本、安装类型
- 状态标签（ACTIVE/INACTIVE）
- 主页链接、设置链接
- 完整描述和权限列表
- 使用 `createPortal` 渲染

---

### 2.2 GroupModule（分组管理模块）

**职责**：管理扩展分组，支持创建、编辑、删除分组

#### 2.2.1 分组标签栏

```typescript
// src/components/group/GroupsBar.tsx
interface GroupsBarProps {
  groups: Group[]
  extensions: Extension[]
  disabled?: boolean
  onSelectGroup: (groupId: string) => void
  onToggleGroup: (group: Group) => void
  onCreateGroup: () => void
}
```

**功能**：
- 水平排列分组标签（flex-wrap）
- 每个标签显示颜色点 + 名称 + 数量 + 电源按钮
- "+" 按钮创建新分组
- Bisect 期间禁用

#### 2.2.2 分组弹窗

```typescript
// src/components/group/GroupModal.tsx
interface GroupModalProps {
  group?: Group                    // 编辑模式传入现有分组
  extensions?: Extension[]         // 组内扩展
  allExtensions?: Extension[]      // 所有扩展
  disableEnableControls?: boolean
  onClose: () => void
  onCreate?: (name, color, extensionIds, iconUrl?) => void
  onToggleExtension?: (id: string) => void
  onDeleteGroup?: (id: string) => void
  onAddExtension?: (groupId, extId) => void
  onRemoveFromGroup?: (groupId, extId) => void
  onUpdateGroup?: (groupId, updates) => void
}
```

**功能**：
- 创建/编辑两种模式
- **GroupEditorPanel**：编辑名称、上传图标、搜索、筛选
- **GroupExtensionPicker**：分两区显示 IN SECTOR / NOT IN SECTOR
- 点击扩展切换组内/组外
- 删除分组（带 ConfirmDialog 确认）
- ESC / 遮罩关闭
- 尺寸：480px × 575px

---

### 2.3 RulesModule（规则自动化模块）

**职责**：创建和管理自动化规则

#### 2.3.1 规则管理器

```typescript
// src/components/rules/RuleManager.tsx
export function RuleManager()
```

**功能**：
- 规则列表展示
- 搜索 + 筛选（ALL/ON/OFF）
- 新建规则按钮
- 规则编辑器弹窗

#### 2.3.2 规则编辑器

```typescript
// src/components/rules/RuleEditor.tsx
```

**功能**：
- 编辑规则名称、描述
- ConditionBuilder：管理条件组（域名 + 可选时间表）
- ActionBuilder：管理动作（启用/禁用 扩展/分组）
- 条件操作符切换（AND/OR）
- 优先级设置

#### 2.3.3 条件构建器

```typescript
// src/components/rules/ConditionBuilder.tsx
interface ConditionBuilderProps {
  conditions: ConditionGroup[]
  onChange: (conditions: ConditionGroup[]) => void
}
```

**功能**：
- 管理多个条件组
- 每个条件组包含：多个域名 + 匹配模式（exact/contains/wildcard/regex）+ 可选时间表（星期+时间范围）
- 添加/删除条件组
- 添加/删除域名

---

### 2.4 PopupModule（Popup页面模块）

**职责**：整合所有功能，提供用户交互界面

#### 2.4.1 页面布局

```
┌────────────────────────────────────────┐
│  Header (Logo + GRID/CARD/DETAIL)      │
├────────────────────────────────────────┤
│  TabBar ([EXTENSIONS] [RULES] [ACTIONS])│
├────────────────────────────────────────┤
│  SearchBar (筛选下拉 + 搜索框)        │
├────────────────────────────────────────┤
│  BisectBanner (仅 Bisect 时显示)      │
├────────────────────────────────────────┤
│  GroupsBar (分组标签行)               │
├────────────────────────────────────────┤
│  Extension Grid/List (扩展内容区)      │
│  ─── 或 ───                            │
│  RuleManager (规则管理界面)            │
├────────────────────────────────────────┤
│  Footer (SYS_STATUS + LIVE)           │
└────────────────────────────────────────┘
```

#### 2.4.2 Header 组件

```typescript
// src/components/popup/Header.tsx
interface HeaderProps {
  viewMode?: ViewMode  // 'compact' | 'card' | 'detail'
  onViewModeChange?: (mode: ViewMode) => void
}
```

**功能**：
- 赛博朋克 Logo（"E" + 霓虹效果）
- 标题 "EXTHELPER" + 副标题 "EXTENSION_MGR_v2.0"
- 三按钮视图切换（GRID / CARD / DETAIL）
- 扫描线装饰动画

#### 2.4.3 搜索栏

```typescript
// src/components/popup/Header.tsx
interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  activeFilter?: FilterType
  onFilterChange?: (filter: FilterType) => void
}
```

**功能**：
- 左侧：筛选下拉菜单（ALL / ON / OFF）
- 右侧：终端风格搜索框（"$" 前缀）
- 清除按钮

#### 2.4.4 ExtensionsActionsMenu

```typescript
// src/components/popup/ExtensionsActionsMenu.tsx
```

**功能**：
- ACTIONS 下拉按钮（位于 Tab 栏右侧）
- 菜单项：Start Bisect、Bisect Good/Bad/Cancel、Enable All、Disable All、Undo [n]、Redo [n]
- 根据状态（bisect active、canUndo/canRedo）禁用对应项

#### 2.4.5 BisectBanner

```typescript
// src/components/popup/BisectBanner.tsx
interface BisectBannerProps {
  bisectSession: BisectSession
  resultExtension: Extension | null
  onGood: () => void
  onBad: () => void
  onCancel: () => void
  onRestore: () => void
}
```

**功能**：
- 仅 Bisect 激活时显示
- 运行中：显示步骤、候选数量，Good/Bad/Cancel 按钮
- 已解决：显示嫌疑扩展名称，Restore Original 按钮

---

## 3. 服务层模块

### 3.1 BrowserAdapter（浏览器适配器）

**职责**：抽象不同浏览器的 API 差异

```typescript
// src/services/browser/adapter.ts
export const browserAdapter = {
  detectBrowser(): BrowserType
  isManifestV3(): boolean

  // 扩展管理
  getExtensions(): Promise<Extension[]>
  setExtensionEnabled(id, enabled): Promise<void>
  uninstallExtension(id): Promise<void>
  openOptionsPage(id): Promise<void>

  // 存储
  getStorage(key): Promise<any>
  setStorage(key, value): Promise<void>

  // 事件监听
  onExtensionInstalled(callback): () => void
  onExtensionUninstalled(callback): () => void
  onExtensionEnabledChanged(callback): () => void

  // Tab / Alarms / Messaging
  getCurrentTabUrl(): Promise<string | null>
  getCurrentTabId(): Promise<number | null>
  createAlarm(name, options): Promise<void>
  clearAlarm(name): Promise<void>
  sendMessage(message, callback?): void
}
```

### 3.2 Repository 服务

| 服务 | 文件 | 职责 |
|------|------|------|
| `extensionsRepo` | `extensionsRepo.ts` | 扩展 CRUD + Bisect 会话 |
| `groupsRepo` | `groupsRepo.ts` | 分组 CRUD |
| `rulesRepo` | `rulesRepo.ts` | 规则 CRUD |
| `preferencesRepo` | `preferencesRepo.ts` | UI 偏好读写 |

### 3.3 devStorage（开发模式存储）

**职责**：Web 预览模式下模拟浏览器存储

```typescript
// src/services/devStorage.ts
class DevStorage {
  getExtensions() / setExtensions() / updateExtension() / removeExtension()
  getGroups() / setGroups()
  getRules() / setRules()
  getPreferences() / setPreferences()
  getBisectSession() / setBisectSession()
  generateId(): string
  on(key, callback): () => void  // 变更监听
}
```

- 内存存储 + localStorage 持久化
- 首次加载使用 mock 数据初始化

### 3.4 规则引擎

```typescript
// src/rules/ruleEngine.ts
class RuleEngine {
  evaluateDomainConditions(conditions, operator, url): boolean
  evaluateScheduleConditions(conditions, operator): boolean
  evaluateConditions(conditions, operator, url?): boolean
  isWithinTimeRange(start, end): boolean
  isDayMatch(days): boolean
  isScheduleMatch(schedule): boolean
  executeActions(actions): Promise<void>
  recordTrigger(ruleId): Promise<void>
}
```

### 3.5 后台服务

```typescript
// src/background/index.ts
class RuleBackgroundService {
  initialize(): Promise<void>
  // 监听 tab URL 变化 → checkDomainRules()
  // 监听 alarms → checkTimeRules()
  // 监听 messages → triggerAllRules()
}
```

---

## 4. 状态管理模块

### 4.1 ExtensionStore

```typescript
interface ExtensionStore {
  // State
  extensions: Extension[]
  loading: boolean
  error: string | null
  filter: FilterType          // 'all' | 'enabled' | 'disabled' | 'favorites'
  searchQuery: string
  sortBy: SortType            // 'name' | 'enabled' | 'recentlyUsed'

  // Undo/Redo
  canUndo: boolean
  canRedo: boolean
  undoCount: number
  redoCount: number

  // Bisect
  bisectSession: BisectSession

  // Actions
  fetchExtensions: () => Promise<void>
  toggleExtension: (id: string) => Promise<void>
  removeExtension: (id: string) => Promise<void>
  setExtensionsEnabled: (ids: string[], enabled: boolean) => Promise<void>
  undoExtensions: () => Promise<void>
  redoExtensions: () => Promise<void>
  startBisect: () => Promise<void>
  markBisectGood: () => Promise<void>
  markBisectBad: () => Promise<void>
  cancelBisect: () => Promise<void>
  finishBisectRestore: () => Promise<void>
  setFilter: (filter: FilterType) => void
  setSearchQuery: (query: string) => void
  setSortBy: (sort: SortType) => void
}
```

内部状态还包含 `history: ExtensionSnapshot[]` 和 `future: ExtensionSnapshot[]` 用于 undo/redo。

### 4.2 GroupStore

```typescript
interface GroupStore {
  groups: Group[]
  activeGroupId: string | null
  expandedGroups: Set<string>
  draggedExtensionId: string | null

  fetchGroups: () => Promise<void>
  createGroup: (name: string, color?: string) => Promise<void>
  deleteGroup: (id: string) => Promise<void>
  renameGroup: (id: string, name: string) => Promise<void>
  updateGroup: (id: string, updates: { name?; color?; icon?; iconUrl? }) => Promise<void>
  selectGroup: (id: string | null) => void
  toggleGroupExpanded: (id: string) => void
  addToGroup: (groupId: string, extId: string) => Promise<void>
  removeFromGroup: (groupId: string, extId: string) => Promise<void>
  setDraggedExtension: (id: string | null) => void
}
```

### 4.3 RuleStore

```typescript
interface RuleStore {
  rules: Rule[]
  loading: boolean
  error: string | null

  fetchRules: () => Promise<void>
  createRule: (rule: Omit<Rule, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>) => Promise<void>
  updateRule: (id: string, updates: Partial<Rule>) => Promise<void>
  deleteRule: (id: string) => Promise<void>
  toggleRule: (id: string) => Promise<void>
  duplicateRule: (id: string) => Promise<void>
}
```

### 4.4 UIStore

```typescript
interface UIStore {
  theme: 'light' | 'dark' | 'system'
  compactMode: boolean
  showDisabled: boolean
  viewMode: ViewMode          // 'compact' | 'card' | 'detail'
  lastUpdate: number

  setTheme: (theme) => void
  toggleCompactMode: () => void
  toggleShowDisabled: () => void
  setViewMode: (mode: ViewMode) => void
}
```

---

## 5. 组件层级

```
src/components/
├── common/
│   ├── Button.tsx              # 按钮组件
│   ├── Switch.tsx              # 二进制开关（1/0）
│   ├── Input.tsx               # 终端风格输入框
│   └── ConfirmDialog.tsx       # 确认弹窗
│
├── extension/
│   ├── ExtensionCard.tsx       # 扩展卡片（三种视图）
│   ├── ExtensionList.tsx       # 扩展列表容器
│   ├── ExtensionContextMenu.tsx # 右键菜单（Portal）
│   ├── ExtensionDetailsModal.tsx # 详情弹窗（Portal）
│   └── index.ts
│
├── group/
│   ├── GroupModal.tsx           # 分组弹窗（创建/编辑模式）
│   ├── GroupsBar.tsx            # 分组标签栏容器
│   ├── GroupChips.tsx           # 分组标签 + 创建标签
│   ├── GroupEditorPanel.tsx     # 分组编辑面板（名称/图标/搜索）
│   ├── GroupExtensionPicker.tsx # 扩展选择器（IN/NOT IN 分区）
│   ├── GroupCard.tsx            # 分组卡片
│   ├── GroupItem.tsx            # 分组项
│   ├── GroupManager.tsx         # 分组管理器
│   ├── groupVisuals.tsx         # 分组视觉相关
│   └── index.ts
│
├── rules/
│   ├── RuleManager.tsx          # 规则管理主组件
│   ├── RuleList.tsx             # 规则列表
│   ├── RuleCard.tsx             # 规则卡片
│   ├── RuleEditor.tsx           # 规则编辑器弹窗
│   ├── ConditionBuilder.tsx     # 条件构建器
│   ├── ActionBuilder.tsx        # 动作构建器
│   ├── RuleBadges.tsx           # 条件/动作摘要徽章
│   └── index.ts
│
├── popup/
│   ├── Header.tsx               # Header + SearchBar + QuickFilters + Footer
│   ├── ExtensionsActionsMenu.tsx # Actions 下拉菜单
│   ├── BisectBanner.tsx         # Bisect 状态横幅
│   └── index.ts
│
└── PopupPage.tsx                # 主页面入口（Tab 导航）
```

---

## 6. 模块依赖关系

```
                    ┌─────────────────────────┐
                    │       PopupPage         │
                    │   (Tab: Extensions/Rules)│
                    └──────────┬──────────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       │                       │                       │
       ▼                       ▼                       ▼
┌─────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Header    │     │  Extensions Tab  │     │    Rules Tab    │
│  SearchBar  │     │ ┌──────────────┐ │     │  RuleManager    │
│  Footer     │     │ │ BisectBanner │ │     │  RuleEditor     │
└─────────────┘     │ │ GroupsBar    │ │     └────────┬────────┘
                    │ │ ExtensionCard│ │              │
                    │ │ ActionsMenu  │ │              ▼
                    │ └──────────────┘ │     ┌──────────────────┐
                    └────────┬─────────┘     │   ruleStore      │
                             │               └────────┬─────────┘
                             ▼                        │
            ┌──────────────────────────┐              ▼
            │  extensionStore          │     ┌──────────────────┐
            │  groupStore              │     │   rulesRepo      │
            │  uiStore                 │     └────────┬─────────┘
            └──────────┬───────────────┘              │
                       │                              │
                       ▼                              ▼
            ┌──────────────────────────────────────────────┐
            │            Repository Layer                   │
            │  extensionsRepo │ groupsRepo │ preferencesRepo│
            └──────────────────────┬───────────────────────┘
                                   │
                       ┌───────────┴───────────┐
                       ▼                       ▼
              ┌──────────────┐        ┌──────────────┐
              │ devStorage   │        │browserAdapter │
              │ (localStorage)│        │(chrome.* API)│
              └──────────────┘        └──────────────┘
```

---

## 7. 类型定义

### 7.1 Extension 接口

```typescript
interface Extension {
  id: string
  name: string
  description: string
  version: string
  enabled: boolean
  iconUrl: string | null
  permissions: string[]
  installType: 'development' | 'normal' | 'sideload'
  optionsUrl: string | null
  homepageUrl: string | null
}
```

### 7.2 Group 接口

```typescript
interface Group {
  id: string
  name: string
  color: string
  icon: string
  iconUrl?: string           // 自定义图标 URL
  extensionIds: string[]
  createdAt: number
  updatedAt: number
  isExpanded: boolean
  order: number
}
```

### 7.3 Rule 接口

```typescript
interface Rule {
  id: string
  name: string
  description?: string
  iconUrl?: string
  enabled: boolean
  conditionGroups: ConditionGroup[]
  conditionOperator: ConditionOperator  // 'AND' | 'OR'
  actions: Action[]
  priority: number
  createdAt: number
  updatedAt: number
  lastTriggeredAt?: number
  triggerCount: number
}

interface ConditionGroup {
  id: string
  domains: string[]
  matchMode: MatchMode  // 'exact' | 'contains' | 'wildcard' | 'regex'
  schedule: {
    days: number[]       // 0=Sun, 1=Mon, ..., 6=Sat
    startTime: string    // "HH:mm"
    endTime: string      // "HH:mm"
  } | null
}

interface Action {
  type: ActionType  // 'enableExtension' | 'disableExtension' | 'enableGroup' | 'disableGroup'
  targetId: string
}
```

### 7.4 BisectSession 接口

```typescript
interface BisectSession {
  active: boolean
  phase: BisectPhase  // 'idle' | 'running' | 'resolved' | 'cancelled'
  baselineExtensions: Extension[]
  allCandidateIds: string[]
  candidateIds: string[]
  currentTestIds: string[]
  parkedIds: string[]
  step: number
  resultId?: string
  resultIds?: string[]
}
```

### 7.5 ViewMode 类型

```typescript
type ViewMode = 'compact' | 'card' | 'detail'
```

---

## 8. Hooks

| Hook | 文件 | 用途 |
|------|------|------|
| `useClickOutside` | `hooks/useClickOutside.ts` | 点击外部区域关闭菜单/弹窗 |
| `useContextMenuPosition` | `hooks/useContextMenuPosition.ts` | 计算右键菜单位置（避免溢出） |
| `useFilteredExtensions` | `stores/extensionStore.ts` | 过滤+排序扩展列表（useMemo） |

---

## 9. 错误处理

| 场景 | 处理方式 |
|------|----------|
| 扩展获取失败 | 显示错误状态，提供 RETRY 按钮 |
| 启用/禁用失败 | 乐观更新回滚，设置 error 状态 |
| 分组/规则操作失败 | 乐观更新回滚（通过 `runOptimisticMutation`） |
| Bisect 启动失败 | 恢复原始状态，清除 bisect session |
| 浏览器 API 不支持 | BrowserError 异常 |
