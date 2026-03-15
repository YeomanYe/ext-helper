# 模块设计文档

## 1. 模块概览

```
┌─────────────────────────────────────────────────────────────────┐
│                         ExtHelper                               │
├──────────────┬──────────────┬──────────────┬──────────────────┤
│  Extension   │    Group     │    Popup     │    Services      │
│  Management │   Management │    UI        │    Layer         │
├──────────────┼──────────────┼──────────────┼──────────────────┤
│ - Extension  │ - Group      │ - Header     │ - BrowserAdapter │
│   List      │   Manager    │ - SearchBar  │ - StorageService │
│ - Toggle     │ - Drag&Drop  │ - Extension  │ - ExtensionAPI   │
│ - Card       │ - Context    │   List       │                  │
│ - Context    │   Menu       │ - Group      │                  │
│   Menu       │              │   Panel      │                  │
└──────────────┴──────────────┴──────────────┴──────────────────┘
```

---

## 2. 核心模块

### 2.1 ExtensionModule（扩展管理模块）

**职责**：负责获取、过滤、操作浏览器扩展

#### 2.1.1 扩展列表组件

```typescript
// src/components/extension/ExtensionList.tsx
interface ExtensionListProps {
  extensions: Extension[];
  onToggle: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, ext: Extension) => void;
  groupId?: string;
}
```

**功能**：
- 展示所有已安装扩展
- 支持搜索过滤
- 支持排序（名称/启用状态/最近使用）
- 虚拟列表优化性能

#### 2.1.2 扩展卡片组件

```typescript
// src/components/extension/ExtensionCard.tsx
interface ExtensionCardProps {
  extension: Extension;
  isEnabled: boolean;
  onToggle: () => void;
  onOpenOptions?: () => void;
  onRemove?: () => void;
}
```

**功能**：
- 显示扩展图标、名称、描述
- 启用/禁用开关
- 快捷操作按钮（设置、卸载）
- 悬停显示详细信息

#### 2.1.3 扩展服务

```typescript
// src/services/extension/extensionService.ts
interface ExtensionService {
  // 获取所有扩展
  getAll(): Promise<Extension[]>;

  // 获取单个扩展详情
  getById(id: string): Promise<Extension | null>;

  // 启用扩展
  enable(id: string): Promise<void>;

  // 禁用扩展
  disable(id: string): Promise<void>;

  // 卸载扩展
  uninstall(id: string): Promise<void>;

  // 打开扩展设置页
  openOptions(id: string): Promise<void>;

  // 获取扩展图标
  getIcon(id: string, size: number): Promise<string | null>;
}
```

---

### 2.2 GroupModule（分组管理模块）

**职责**：管理扩展分组，支持拖拽排序、自定义分组

#### 2.2.1 分组管理器

```typescript
// src/components/group/GroupManager.tsx
interface GroupManagerProps {
  groups: Group[];
  activeGroup: string | null;
  onSelectGroup: (id: string | null) => void;
  onCreateGroup: (name: string) => void;
  onDeleteGroup: (id: string) => void;
  onRenameGroup: (id: string, name: string) => void;
}
```

**功能**：
- 创建/删除/重命名分组
- 展开/收起分组
- 分组快捷访问
- 分组快捷键支持

#### 2.2.2 拖拽排序

```typescript
// src/components/group/DraggableGroup.tsx
interface DraggableGroupProps {
  group: Group;
  extensions: Extension[];
  onDrop: (extId: string, groupId: string) => void;
  onDragStart: (extId: string) => void;
  onDragEnd: () => void;
}
```

**功能**：
- 拖拽扩展到分组
- 分组内扩展排序
- 跨分组移动
- 拖拽视觉反馈

#### 2.2.3 分组服务

```typescript
// src/services/extension/groupService.ts
interface GroupService {
  // 获取所有分组
  getAll(): Promise<Group[]>;

  // 创建分组
  create(name: string, color?: string): Promise<Group>;

  // 更新分组
  update(id: string, data: Partial<Group>): Promise<Group>;

  // 删除分组
  delete(id: string): Promise<void>;

  // 添加扩展到分组
  addExtension(groupId: string, extId: string): Promise<void>;

  // 从分组移除扩展
  removeExtension(groupId: string, extId: string): Promise<void>;

  // 移动扩展到分组
  moveExtension(extId: string, fromGroup: string, toGroup: string): Promise<void>;
}
```

---

### 2.3 PopupModule（Popup页面模块）

**职责**：整合所有功能，提供用户交互界面

#### 2.3.1 页面布局

```
┌────────────────────────────────────────┐
│  ┌──────────────────────────────────┐  │
│  │ Header                           │  │
│  │ [Logo] ExtHelper    [⚙️] [🔍]   │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ SearchBar                        │  │
│  │ [🔍 搜索扩展...]                 │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ QuickFilters                     │  │
│  │ [全部] [已启用] [已禁用] [⚡]    │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ Groups                           │  │
│  │ ▼ 工作                            │  │
│  │   ├ Ext A                        │  │
│  │   └ Ext B                        │  │
│  │ ▶ 娱乐                            │  │
│  │ + 新建分组                        │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ Extension List                   │  │
│  │ [📷] Ext Name          [━━━━]   │  │
│  │ [📷] Ext Name          [--++]   │  │
│  │ ...                              │  │
│  └──────────────────────────────────┘  │
│  ┌──────────────────────────────────┐  │
│  │ Footer                           │  │
│  │ 共 XX 个扩展    [批量操作 ▼]     │  │
│  └──────────────────────────────────┘  │
└────────────────────────────────────────┘
```

#### 2.3.2 头部组件

```typescript
// src/components/popup/Header.tsx
interface HeaderProps {
  onSettingsClick: () => void;
  onSearchFocus: () => void;
}
```

#### 2.3.3 搜索栏

```typescript
// src/components/popup/SearchBar.tsx
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}
```

#### 2.3.4 快速筛选

```typescript
// src/components/popup/QuickFilters.tsx
type FilterType = 'all' | 'enabled' | 'disabled' | 'favorites';

interface QuickFiltersProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}
```

---

## 3. 服务层模块

### 3.1 BrowserAdapter（浏览器适配器）

**职责**：抽象不同浏览器的API差异

```typescript
// src/services/browser/types.ts
interface BrowserAdapter {
  // 环境检测
  detectBrowser(): BrowserType;
  isManifestV3(): boolean;

  // 扩展管理API
  getExtensions(): Promise<ExtensionInfo[]>;
  getExtension(id: string): Promise<ExtensionInfo | null>;
  setEnabled(id: string, enabled: boolean): Promise<void>;
  uninstall(id: string): Promise<void>;
  openOptionsPage(id: string): Promise<void>;

  // 存储API
  getStoragearea(area: 'local' | 'sync'): StorageArea;
  getFromStorage(key: string, area?: StorageArea): Promise<any>;
  setToStorage(key: string, value: any, area?: StorageArea): Promise<void>;
  removeFromStorage(key: string, area?: StorageArea): Promise<void>;

  // 事件监听
  onExtensionInstalled(callback: Listener<ExtensionInfo>): void;
  onExtensionUninstalled(callback: Listener<string>): void;
  onExtensionEnabledChanged(callback: Listener<ExtensionInfo>): void;
}
```

#### 3.1.1 适配器实现

| 适配器 | 支持浏览器 | 特殊处理 |
|--------|------------|----------|
| ChromeAdapter | Chrome, Edge, Brave | 标准API |
| FirefoxAdapter | Firefox | browser命名空间 |
| SafariAdapter | Safari | Safari特定限制 |

### 3.2 StorageService（存储服务）

**职责**：统一管理本地数据存储

```typescript
// src/services/storage/storageService.ts
interface StorageService {
  // 分组数据
  getGroups(): Promise<Group[]>;
  saveGroups(groups: Group[]): Promise<void>;

  // 用户偏好
  getPreferences(): Promise<Preferences>;
  savePreferences(prefs: Partial<Preferences>): Promise<void>;

  // 搜索历史
  getSearchHistory(): Promise<string[]>;
  addSearchHistory(query: string): Promise<void>;

  // 导出/导入
  exportData(): Promise<ExportData>;
  importData(data: ExportData): Promise<void>;
}
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

  // Computed
  filteredExtensions: () => Extension[];
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
  compactMode: boolean;
  showDisabled: boolean;
  lastUpdate: number;

  // Actions
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleCompactMode: () => void;
  toggleShowDisabled: () => void;
}
```

---

## 5. 工具模块

### 5.1 Hooks

| Hook | 用途 |
|------|------|
| `useExtensions` | 获取和管理扩展列表 |
| `useGroups` | 获取和管理分组 |
| `useSearch` | 搜索和过滤 |
| `useDragDrop` | 拖拽排序逻辑 |
| `useTheme` | 主题管理 |
| `useKeyboard` | 键盘快捷键 |

### 5.2 工具函数

```typescript
// src/utils/
├── extensions.ts      // 扩展相关工具
├── groups.ts          // 分组相关工具
├── storage.ts         // 存储工具
├── browser.ts         // 浏览器检测
└── cn.ts             // className合并
```

---

## 6. 组件层级

```
src/components/
├── common/                    # 通用组件
│   ├── Button/
│   ├── Switch/
│   ├── Input/
│   ├── Dropdown/
│   ├── Modal/
│   ├── ContextMenu/
│   └── Tooltip/
│
├── extension/                 # 扩展组件
│   ├── ExtensionList/
│   │   ├── ExtensionList.tsx
│   │   └── index.ts
│   ├── ExtensionCard/
│   │   ├── ExtensionCard.tsx
│   │   ├── ExtensionIcon.tsx
│   │   └── index.ts
│   ├── ExtensionContextMenu/
│   │   ├── ExtensionContextMenu.tsx
│   │   └── index.ts
│   └── ExtensionEmpty/
│
├── group/                     # 分组组件
│   ├── GroupManager/
│   │   ├── GroupManager.tsx
│   │   └── index.ts
│   ├── GroupItem/
│   │   ├── GroupItem.tsx
│   │   ├── GroupHeader.tsx
│   │   └── index.ts
│   ├── DraggableExtension/
│   │   ├── DraggableExtension.tsx
│   │   └── index.ts
│   └── CreateGroupModal/
│
└── popup/                     # Popup页面组件
    ├── PopupPage/
    │   ├── PopupPage.tsx
    │   └── index.ts
    ├── Header/
    │   ├── Header.tsx
    │   ├── SearchBar.tsx
    │   ├── QuickFilters.tsx
    │   └── index.ts
    ├── Settings/
    │   ├── SettingsPage.tsx
    │   └── index.ts
    └── Footer/
        ├── Footer.tsx
        └── index.ts
```

---

## 7. 模块依赖关系

```
                    ┌─────────────────────┐
                    │     PopupPage      │
                    │   (入口组件)        │
                    └─────────┬───────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
   │  Header    │    │ExtensionList│    │ GroupManager│
   └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
          │                  │                  │
          │                  ▼                  │
          │          ┌─────────────┐            │
          │          │ExtensionCard│            │
          │          └──────┬──────┘            │
          │                 │                   │
          └─────────────────┼───────────────────┘
                            │
                            ▼
               ┌────────────────────────┐
               │    Service Layer       │
               │  ┌──────────────────┐ │
               │  │ ExtensionService  │ │
               │  │ GroupService      │ │
               │  │ StorageService    │ │
               │  │ BrowserAdapter    │ │
               │  └──────────────────┘ │
               └───────────┬────────────┘
                           │
                           ▼
               ┌────────────────────────┐
               │   Browser API Layer    │
               │ chrome.management      │
               │ chrome.storage         │
               │ browser.* (Firefox)    │
               └────────────────────────┘
```

---

## 8. 模块接口契约

### 8.1 Extension接口

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

### 8.2 Group接口

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

---

## 9. 错误处理

| 场景 | 处理方式 |
|------|----------|
| 扩展获取失败 | 显示错误状态，提供重试按钮 |
| 启用/禁用失败 | Toast提示错误，回滚状态 |
| 存储配额超限 | 提示用户清理数据 |
| 浏览器API不支持 | 显示兼容提示，降级功能 |
