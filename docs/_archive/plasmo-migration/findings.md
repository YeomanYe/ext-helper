# Findings: Migrate to Plasmo

## Research Summary

### 1. Plasmo 包信息
- **包名**: `plasmo` (唯一主包)
- **npm**: https://www.npmjs.com/package/plasmo
- **版本**: 0.90.5 (最新，发布于 10 个月前)
- **Stars**: 12.9k

### 2. 之前错误原因
- 错误使用: `@plasmo/ext-framework` - 此包不存在
- 正确使用: `pnpm add plasmo`

### 3. Plasmo 特性
- 声明式 manifest (无需手动创建 manifest.json)
- 自动跨浏览器支持 (Chrome, Firefox, Safari, Edge)
- Live-reloading + HMR
- 支持 React/Svelte/Vue
- 内置 Storage API
- 内置 Messaging API

### 4. 当前项目资产可复用
- 所有 React 组件 (ExtensionCard, GroupChip, etc.)
- Zustand stores (uiStore, extensionStore, groupStore)
- Tailwind CSS 配置
- 业务逻辑 (mockData, BrowserAdapter)
- Types 类型定义

### 5. Plasmo 项目结构
```
ext-helper/
├── assets/
│   └── icon.png (扩展图标)
├── src/
│   ├── popup/
│   │   └── index.tsx (popup 入口)
│   ├── background/
│   │   └── index.ts (service worker)
│   └── ...
├── package.json
├── tailwind.config.js
└── tsconfig.json
```

### 6. 安装命令
```bash
pnpm add plasmo
```

### 7. 运行命令
```bash
pnpm dev     # 开发模式
pnpm build   # 生产构建
```

## Comparison: Vite vs Plasmo

| 方面 | 当前 Vite | Plasmo |
|------|-----------|--------|
| manifest | 手动创建 | 自动生成 |
| HMR | 需要配置 | 内置 |
| 跨浏览器 | 手动 Adapter | 内置抽象 |
| 发布 | 手动打包 | BPP 自动发布 |
