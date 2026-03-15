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
| 框架 | Plasmo | 跨浏览器扩展开发框架，支持Chrome、Firefox、Safari |
| 前端 | React 19 | 最新React版本，支持并发特性 |
| 构建 | Vite | 快速开发体验和构建 |
| 包管理 | pnpm | 高效的Monorepo支持 |
| 状态管理 | Zustand | 轻量级状态管理 |
| UI组件 | shadcn/ui | 可定制化组件库 |
| 样式 | Tailwind CSS | 原子化CSS框架 |

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
- 使用 Plasmo 的跨浏览器API抽象层
- 检测浏览器类型，动态加载对应适配器
- 遵循各浏览器Manifest版本（MV3为主）

### 2.3 项目结构

```
ext-helper/
├── src/
│   ├── components/           # React组件
│   │   ├── common/           # 通用组件
│   │   ├── extension/        # 扩展相关组件
│   │   ├── group/            # 分组相关组件
│   │   └── popup/             # Popup页面组件
│   ├── hooks/                # 自定义Hooks
│   ├── stores/               # Zustand状态存储
│   ├── services/             # 业务逻辑服务
│   │   ├── browser/          # 浏览器适配层
│   │   ├── extension/        # 扩展管理服务
│   │   └── storage/          # 存储服务
│   ├── types/                # TypeScript类型定义
│   ├── utils/                # 工具函数
│   └── styles/               # 全局样式
├── docs/                     # 文档
├── plasmo.config.ts          # Plasmo配置
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

---

## 3. 核心架构设计

### 3.1 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                      │
│         (React Components + shadcn/ui + Tailwind)          │
├─────────────────────────────────────────────────────────────┤
│                     Application Layer                        │
│                   (Zustand Stores + Hooks)                   │
├─────────────────────────────────────────────────────────────┤
│                      Service Layer                           │
│     (Extension Service + Browser Adapter + Storage)         │
├─────────────────────────────────────────────────────────────┤
│                       Data Layer                             │
│           (chrome.storage + browser.runtime)                 │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 跨浏览器抽象层

```typescript
// src/services/browser/adapter.ts
interface BrowserAdapter {
  // 扩展管理
  getExtensions(): Promise<ExtensionInfo[]>;
  setExtensionEnabled(id: string, enabled: boolean): Promise<void>;

  // 存储
  getStorage(key: string): Promise<any>;
  setStorage(key: string, value: any): Promise<void>;

  // 监听
  onExtensionInstalled(callback: (info: ExtensionInfo) => void): void;
  onExtensionUninstalled(callback: (id: string) => void): void;
}

// 实现：
// - ChromeAdapter (Chrome/Edge/Brave)
// - FirefoxAdapter (Firefox)
// - SafariAdapter (Safari)
```

### 3.3 状态管理架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Root Store                              │
│                    (Zustand Store)                          │
├─────────────────────────────────────────────────────────────┤
│  extensionStore    │  groupStore    │  uiStore             │
│  - extensions[]    │  - groups[]    │  - activeGroup       │
│  - loading         │  - expanded    │  - searchQuery       │
│  - error           │  - dragOver    │  - theme             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. 数据流设计

### 4.1 单向数据流

```
User Action → Component → Hook → Store → Service → Browser API
                ↑                                    │
                └──────────── State Update ←────────┘
```

### 4.2 关键数据流

1. **加载扩展列表**
   ```
   Popup打开 → useExtensionStore.getExtensions()
   → ExtensionService.getExtensions()
   → BrowserAdapter.getExtensions()
   → chrome.management.getAll()
   → 更新Store → 渲染UI
   ```

2. **启用/禁用扩展**
   ```
   用户点击 toggle → toggleExtension(id)
   → BrowserAdapter.setExtensionEnabled()
   → chrome.management.setEnabled()
   → 更新Store → 重新渲染
   ```

3. **分组管理**
   ```
   用户操作分组 → groupStore.update()
   → StorageService.save()
   → chrome.storage.local.set()
   ```

---

## 5. 关键技术决策

### 5.1 为什么选择 Plasmo？

| 特性 | 优势 |
|------|------|
| 跨浏览器 | 统一API抽象，自动适配Chrome/Firefox/Safari |
| 零配置 | 内置TypeScript、Vite、Hot Reload支持 |
| MV3优先 | 支持Manifest V3最新特性 |
| 开发体验 | 实时重载、错误提示 |

### 5.2 为什么选择 Zustand？

| 特性 | 优势 |
|------|------|
| 轻量 | 无Context.Provider嵌套 |
| 简洁 | 极少的样板代码 |
| 异步原生 | 内置异步支持 |
| TypeScript | 优秀的类型推断 |

### 5.3 为什么选择 shadcn/ui？

| 特性 | 优势 |
|------|------|
| 可定制 | 完全控制源码 |
| 无运行时 | 零依赖bundle |
| 一致性 | 统一的设计语言 |
| 可访问 | WCAG 2.1 AA |

---

## 6. 扩展性设计

### 6.1 插件化设计

```
┌─────────────────────────────────────────────────────────────┐
│                     Core (不可变)                            │
├─────────────────────────────────────────────────────────────┤
│  ExtensionLoader │ GroupManager │ StorageService            │
├─────────────────────────────────────────────────────────────┤
│                    Plugins (可扩展)                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │ QuickAccess  │ │  Shortcuts  │ │   Themes    │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 预留扩展点

1. **自定义主题** - 支持动态主题切换
2. **快捷键** - 全局快捷键支持
3. **数据导出** - 扩展配置导出/导入
4. **云同步** - 跨设备配置同步（可选）

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
- 分组配置加密存储（可选）

---

## 8. 性能设计

### 8.1 性能目标

| 指标 | 目标值 |
|------|--------|
| Popup打开时间 | < 200ms |
| 扩展列表渲染 | < 100ms |
| 启用/禁用响应 | < 50ms |

### 8.2 优化策略

1. **虚拟列表** - 扩展数量 > 50 时使用虚拟滚动
2. **懒加载** - 非关键组件延迟加载
3. **缓存** - 扩展信息缓存，减少API调用
4. **增量更新** - 只更新变化的UI部分

---

## 9. 总结

本架构采用**分层 + 适配器**模式，通过Plasmo框架实现跨浏览器兼容，同时保持代码的简洁性和可维护性。技术栈选型遵循"现代、轻量、可定制"原则，确保最佳的开发体验和用户体验。
