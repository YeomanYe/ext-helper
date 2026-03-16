# 模块设计文档

## 1. 模块概览

```
┌─────────────────────────────────────────────────────────────────┐
│                         ExtHelper                                │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│  Extension   │    Group     │    Popup    │    Services      │
│  Management  │   Management │    UI       │    Layer         │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│ ExtensionCard│ GroupChip    │ Header      │ BrowserAdapter   │
│ ExtensionList│ GroupModal   │ Footer      │ MockData         │
│              │              │ SearchBar   │                 │
│              │              │ QuickFilters│                 │
└──────────────┴──────────────┴──────────────┴──────────────────┘
```

---

## 2. 核心模块

### 2.1 ExtensionModule（扩展管理模块）

**职责**：负责获取、过滤、操作浏览器扩展

#### 2.1.1 扩展卡片组件

```typescript
// src/components/extension/ExtensionCard.tsx
interface ExtensionCardProps {
  extension: Extension;
  onToggle: () => void;
  onOpenOptions?: () => void;
  onRemove?: () => void;
  viewMode?: 'card' | 'compact';
}
```

**功能**：
- 显示扩展图标、名称
- 支持卡片/紧凑两种视图模式
- 右键菜单：启用/禁用、设置页面、卸载
- 点击图标切换启用状态

#### 2.1.2 扩展列表组件

```typescript
// src/components/extension/ExtensionList.tsx
interface ExtensionListProps {
  extensions: Extension[];
  onToggle: (id: string) => void;
  onOpenOptions?: (id: string) => void;
  onRemove?: (id: string) => void;
  viewMode?: 'card' | 'compact';
  loading?: boolean;
}
```

**功能**：
- 网格布局展示扩展卡片
- 支持加载状态（骨架屏）
- 支持空状态显示

---

### 2.2 GroupModule（分组管理模块）

**职责**：管理扩展分组，支持创建、删除分组

#### 2.2.1 分组标签组件

```typescript
// src/components/group/GroupModal.tsx
interface GroupChipProps {
  group: Group;
  isActive: boolean;
  extensionCount: number;
  onClick: () => void;
}
```

**功能**：
- 水平标签显示分组
- 颜色标记、扩展数量
- 激活状态样式

#### 2.2.2 分组详情弹窗

```typescript
// src/components/group/GroupModal.tsx
interface GroupDetailModalProps {
  group: Group;
  extensions: Extension[];
  viewMode?: 'card' | 'compact';
  onClose: () => void;
  onToggleExtension: (id: string) => void;
  onOpenOptions?: (id: string) => void;
  onRemove?: (id: string) => void;
}
```

**功能**：
- 点击分组标签弹出
- 展示组内所有扩展
- 支持启用/禁用、卸载操作
- ESC键关闭

---

### 2.3 PopupModule（Popup页面模块）

**职责**：整合所有功能，提供用户交互界面

#### 2.3.1 页面布局

```
┌────────────────────────────────────────┐
│  Header (Logo + 视图切换按钮)         │
├────────────────────────────────────────┤
│  SearchBar                           │
├────────────────────────────────────────┤
│  GroupChips (水平分组标签)            │
├────────────────────────────────────────┤
│  QuickFilters (全部/已启用/已禁用)    │
├────────────────────────────────────────┤
│  Extension Grid (扩展卡片网格)         │
│  ┌─────────┐ ┌─────────┐              │
│  │ 📷 Name │ │ 📷 Name │              │
│  └─────────┘ └─────────┘              │
├────────────────────────────────────────┤
│  Footer (统计信息)                    │
└────────────────────────────────────────┘
```

#### 2.3.2 Header组件

```typescript
// src/components/popup/Header.tsx
interface HeaderProps {
  viewMode?: 'card' | 'compact';
  onViewModeChange?: (mode: 'card' | 'compact') => void;
  onSettingsClick?: () => void;
}
```

**功能**：
- Logo和标题
- 视图切换按钮（卡片/紧凑）
- 设置按钮

#### 2.3.3 搜索栏

```typescript
// src/components/popup/Header.tsx
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
```

---

## 3. 服务层模块

### 3.1 BrowserAdapter（浏览器适配器）

**职责**：抽象不同浏览器的API差异

```typescript
// src/services/browser/adapter.ts
interface BrowserAdapter {
  // 环境检测
  detectBrowser(): BrowserType;
  isManifestV3(): boolean;

  // 扩展管理API
  getExtensions(): Promise<Extension[]>;
  getExtension(id: string): Promise<Extension | null>;
  setEnabled(id: string, enabled: boolean): Promise<void>;
  uninstall(id: string): Promise<void>;
  openOptionsPage(id: string): Promise<void>;

  // 存储API
  getStorage(key: string): Promise<any>;
  setStorage(key: string, value: any): Promise<void>;

  // 事件监听
  onExtensionInstalled(callback: Listener<Extension>): () => void;
  onExtensionUninstalled(callback: Listener<string>): () => void;
  onExtensionEnabledChanged(callback: Listener<Extension>): () => void;
}
```

### 3.2 MockDataService（开发模式数据）

**职责**：提供开发模式下的模拟数据

```typescript
// src/services/mockData.ts
export const MOCK_EXTENSIONS: Extension[]
export const MOCK_GROUPS: Group[]
export function isDevMode(): boolean
```

---

## 4. 状态管理模块

### 4.1 ExtensionStore

```typescript
// src/stores/extensionStore.ts
interface ExtensionStore {
  // State
  extensions: Extension[];
  loading: boolean;
  error: string | null;
  filter: FilterType;
  searchQuery: string;
  sortBy: SortType;

  // Actions
  fetchExtensions: () => Promise<void>;
  toggleExtension: (id: string) => Promise<void>;
  setFilter: (filter: FilterType) => void;
  setSearchQuery: (query: string) => void;
  setSortBy: (sort: SortType) => void;
}
```

### 4.2 GroupStore

```typescript
// src/stores/groupStore.ts
interface GroupStore {
  // State
  groups: Group[];
  activeGroupId: string | null;
  expandedGroups: Set<string>;
  draggedExtensionId: string | null;

  // Actions
  fetchGroups: () => Promise<void>;
  createGroup: (name: string, color?: string) => Promise<void>;
  deleteGroup: (id: string) => Promise<void>;
  renameGroup: (id: string, name: string) => Promise<void>;
  selectGroup: (id: string | null) => void;
  toggleGroupExpanded: (id: string) => void;
  addToGroup: (groupId: string, extId: string) => Promise<void>;
  removeFromGroup: (groupId: string, extId: string) => Promise<void>;
  setDraggedExtension: (id: string | null) => void;
}
```

### 4.3 UIStore

```typescript
// src/stores/uiStore.ts
interface UIStore {
  // State
  theme: 'light' | 'dark' | 'system';
  viewMode: 'card' | 'compact';
  compactMode: boolean;
  showDisabled: boolean;
  lastUpdate: number;

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setViewMode: (mode: 'card' | 'compact') => void;
  toggleCompactMode: () => void;
  toggleShowDisabled: () => void;
}
```

---

## 5. 组件层级

```
src/components/
├── common/
│   ├── Button/
│   ├── Switch/
│   └── Input/
│
├── extension/
│   ├── ExtensionCard/       # 扩展卡片（支持两种视图）
│   │   ├── ExtensionCard.tsx
│   │   └── index.ts
│   └── ExtensionList/       # 扩展列表网格
│       ├── ExtensionList.tsx
│       └── index.ts
│
├── group/
│   ├── GroupModal/          # 分组标签和弹窗
│   │   ├── GroupModal.tsx  # GroupChip, GroupDetailModal
│   │   └── index.ts
│   ├── GroupCard/          # (保留，暂未使用)
│   └── GroupManager/        # (保留，暂未使用)
│
└── popup/
    ├── Header/              # 头部 + 视图切换
    │   ├── Header.tsx       # SearchBar, QuickFilters, Footer
    │   └── index.ts
    └── PopupPage/           # 主页面组件
        ├── PopupPage.tsx
        └── index.ts
```

---

## 6. 模块依赖关系

```
                    ┌─────────────────────┐
                    │     PopupPage       │
                    │   (入口组件)        │
                    └─────────┬───────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │   Header    │    │ GroupModal  │    │ExtensionList│
   │ (SearchBar)│    │ (GroupChip) │    │(ExtensionCard)│
   └─────────────┘    └──────┬──────┘    └──────┬──────┘
                              │                  │
                              ▼                  ▼
               ┌────────────────────────┐
               │    Service Layer     │
               │  ┌────────────────┐  │
               │  │ BrowserAdapter │  │
               │  │   MockData     │  │
               │  └────────────────┘  │
               └───────────┬────────────┘
                           │
                           ▼
               ┌────────────────────────┐
               │   Browser API Layer  │
               │ chrome.management    │
               │ chrome.storage       │
               │ browser.* (Firefox) │
               └────────────────────────┘
```

---

## 7. 类型定义

### 7.1 Extension接口

```typescript
interface Extension {
  id: string;
  name: string;
  description: string;
  version: string;
  enabled: boolean;
  iconUrl: string | null;
  permissions: string[];
  installType: 'development' | 'normal' | 'sideload';
  optionsUrl: string | null;
  homepageUrl: string | null;
}
```

### 7.2 Group接口

```typescript
interface Group {
  id: string;
  name: string;
  color: string;
  icon: string;
  extensionIds: string[];
  createdAt: number;
  updatedAt: number;
  isExpanded: boolean;
  order: number;
}
```

### 7.3 ViewMode类型

```typescript
type ViewMode = 'card' | 'compact';
```

---

## 8. 错误处理

| 场景 | 处理方式 |
|------|----------|
| 扩展获取失败 | 显示错误状态，提供重试按钮 |
| 启用/禁用失败 | 乐观更新回滚，Toast提示错误 |
| 存储配额超限 | 提示用户清理数据 |
| 浏览器API不支持 | 显示兼容提示，降级功能 |
