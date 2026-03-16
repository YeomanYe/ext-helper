# 浏览器扩展管理插件 - 架构文档

## 1. 项目概述

### 1.1 项目名称
**ExtHelper** - 浏览器扩展管理插件

### 1.2 项目定位
一个跨浏览器的扩展管理工具，提供扩展的启用/禁用、分组管理、快捷操作等功能，统一管理用户安装的所有浏览器扩展。

### 1.3 目标用户
- 需要管理大量浏览器扩展的高级用户
- 开发者需要快速切换扩展状态
- 用户希望对扩展进行分类管理

---

## 2. 技术架构

### 2.1 技术栈

| 类别 | 技术选型 | 说明 |
|------|----------|------|
| 框架 | Plasmo 0.90.x | 浏览器扩展开发框架 |
| 前端 | React 18 | UI框架 |
| 构建 | Plasmo CLI | 内置Vite构建 |
| 包管理 | pnpm | 高效的包管理 |
| 状态管理 | Zustand 4.x | 轻量级状态管理 |
| 样式 | Tailwind CSS 3.x | 原子化CSS框架 |
| 图标 | Lucide React | 图标库 |

**注**：使用 Plasmo 框架进行浏览器扩展开发，提供声明式 Manifest、跨浏览器支持、Live-reloading 等特性。

### 2.2 浏览器兼容性

```
┌─────────────────────────────────────────────────────────────┐
│                    浏览器兼容性矩阵                          │
├──────────────┬──────────────┬──────────────┬───────────────┤
│    Chrome   │   Firefox    │    Safari    │   Edge        │
├──────────────┼──────────────┼──────────────┼───────────────┤
│    120+     │    121+      │    17.0+     │    120+       │
└──────────────┴──────────────┴──────────────┴───────────────┘
```

**兼容性策略**：
- 使用 Plasmo 内置的跨浏览器抽象层
- 支持 Chrome、Firefox、Safari、Edge 等主流浏览器
- 遵循 Manifest V3

### 2.3 项目结构

```
ext-helper/
├── src/
│   ├── components/           # React组件
│   │   ├── common/          # 通用组件 (Button, Switch, Input)
│   │   ├── extension/       # 扩展组件 (ExtensionCard, ExtensionList)
│   │   ├── group/          # 分组组件 (GroupChip, GroupModal)
│   │   └── popup/           # Popup页面组件 (Header, Footer)
│   ├── stores/              # Zustand状态管理
│   │   ├── extensionStore.ts
│   │   ├── groupStore.ts
│   │   └── uiStore.ts
│   ├── services/            # 业务逻辑服务
│   │   ├── browser/        # 浏览器适配层
│   │   └── mockData.ts     # 开发模式Mock数据
│   ├── types/               # TypeScript类型定义
│   ├── utils/               # 工具函数
│   └── styles/              # 全局样式
├── public/
│   └── manifest.json         # 扩展清单
├── docs/                     # 文档
├── index.html               # 入口HTML
├── vite.config.ts           # Vite配置
├── tailwind.config.ts       # Tailwind配置
├── package.json
└── tsconfig.json
```

---

## 3. 核心架构设计

### 3.1 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                        │
│              (React Components + Tailwind CSS)               │
├─────────────────────────────────────────────────────────────┤
│                     Application Layer                         │
│                   (Zustand Stores)                           │
├─────────────────────────────────────────────────────────────┤
│                      Service Layer                           │
│        (BrowserAdapter + MockData + Storage Service)         │
├─────────────────────────────────────────────────────────────┤
│                       Data Layer                             │
│          (chrome.storage / browser.storage)                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 跨浏览器抽象层

```typescript
// src/services/browser/adapter.ts
interface BrowserAdapter {
  // 扩展管理
  getExtensions(): Promise<Extension[]>;
  setExtensionEnabled(id: string, enabled: boolean): Promise<void>;
  uninstallExtension(id: string): Promise<void>;
  openOptionsPage(id: string): Promise<void>;

  // 存储
  getStorage(key: string): Promise<any>;
  setStorage(key: string, value: any): Promise<void>;

  // 事件监听
  onExtensionInstalled(callback: (info: Extension) => void): () => void;
  onExtensionUninstalled(callback: (id: string) => void): () => void;
  onExtensionEnabledChanged(callback: (info: Extension) => void): () => void;
}
```

### 3.3 状态管理架构

```
┌─────────────────────────────────────────────────────────────┐
│                     ExtensionStore                          │
│  - extensions[]                                            │
│  - loading, error                                          │
│  - filter, searchQuery, sortBy                             │
│  - fetchExtensions(), toggleExtension()                    │
├─────────────────────────────────────────────────────────────┤
│                      GroupStore                             │
│  - groups[]                                               │
│  - activeGroupId, expandedGroups                          │
│  - createGroup(), deleteGroup(), renameGroup()            │
├─────────────────────────────────────────────────────────────┤
│                       UIStore                                │
│  - theme, viewMode, compactMode                            │
│  - setTheme(), setViewMode()                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 数据流设计

### 4.1 单向数据流

```
User Action → Component → Store → Service → Browser API
                ↑                                    │
                └──────────── State Update ←────────┘
```

### 4.2 开发模式数据流

```
isDevMode() → MOCK_EXTENSIONS → displayExtensions
                ↓
            MOCK_GROUPS → displayGroups
```

### 4.3 关键数据流

1. **加载扩展列表**
   ```
   Popup打开 → fetchExtensions()
   → BrowserAdapter.getExtensions()
   → chrome.management.getAll()
   → 更新Store → 渲染UI
   ```

2. **启用/禁用扩展 (乐观更新)**
   ```
   用户点击图标 → toggleExtension(id)
   → 立即更新Store状态
   → 调用BrowserAdapter.setEnabled()
   → 失败则回滚状态
   ```

3. **分组管理**
   ```
   用户操作分组 → groupStore方法
   → BrowserAdapter.setStorage()
   → chrome.storage.local.set()
   ```

---

## 5. 关键技术决策

### 5.1 为什么选择纯 Vite + React？

| 特性 | 优势 |
|------|------|
| 轻量 | 无多余框架负担 |
| 灵活 | 可完全控制构建配置 |
| 快速 | Vite极速开发体验 |
| 兼容 | 容易适配各种浏览器 |

### 5.2 为什么选择 Zustand？

| 特性 | 优势 |
|------|------|
| 轻量 | 无Context.Provider嵌套 |
| 简洁 | 极少的样板代码 |
| 异步原生 | 内置异步支持 |
| TypeScript | 优秀的类型推断 |

### 5.3 为什么手动实现UI组件？

| 特性 | 优势 |
|------|------|
| 轻量 | 无额外依赖 |
| 控制 | 完全掌控样式和行为 |
| 定制 | 按需实现功能 |

---

## 6. 开发模式支持

### 6.1 本地Web访问

开发模式下 (`pnpm dev`) 可通过 `http://localhost:3000` 访问页面，方便UI开发和调试。

### 6.2 Mock数据

```typescript
// src/services/mockData.ts
export const MOCK_EXTENSIONS: Extension[] = [
  // 15个模拟扩展，包含各种类型
]

export const MOCK_GROUPS: Group[] = [
  // 3个模拟分组
]

export function isDevMode(): boolean {
  return typeof window !== "undefined" &&
    !window.location.href.includes("chrome-extension")
}
```

---

## 7. 安全设计

### 7.1 权限最小化

```json
{
  "permissions": [
    "management",
    "storage"
  ],
  "host_permissions": []
}
```

### 7.2 数据安全

- 本地存储优先，不收集用户数据
- 扩展ID和名称本地处理，不上传
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

1. **乐观更新** - 操作立即响应，后台同步
2. **状态持久化** - 视图模式等偏好本地缓存
3. **按需渲染** - 只渲染可见区域
4. **Memoization** - useMemo/useCallback 减少重渲染

---

## 9. 总结

本架构采用**分层 + 适配器**模式，通过自定义BrowserAdapter实现跨浏览器兼容。技术栈选型遵循"简洁、轻量、可维护"原则，开发体验通过Vite和Mock数据得到保障。
