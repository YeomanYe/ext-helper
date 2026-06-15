# Task Plan: Migrate to Plasmo Framework

## Goal
将当前 Vite+React 项目迁移回 Plasmo 框架

## Current State
- 技术栈: Plasmo 0.90.5 + React 18 + Zustand + Tailwind
- 项目状态: ✅ 开发服务器运行正常

## Migration Phases

### Phase 1: 准备阶段 ✅
- [x] 1.1 分析现有代码结构和依赖
- [x] 1.2 确定需要保留的组件/逻辑
- [x] 1.3 创建 Plasmo 项目结构

### Phase 2: 核心迁移 ✅
- [x] 2.1 安装 Plasmo 依赖 (plasmo@0.90.5)
- [x] 2.2 创建 popup.tsx 入口
- [x] 2.3 配置 manifest (通过 package.json plasmo 字段)
- [x] 2.4 迁移 React 组件到 src/ 目录结构

### Phase 3: 功能迁移 ✅
- [x] 3.1 Zustand stores 保留在 src/stores
- [x] 3.2 BrowserAdapter 保留在 src/services
- [x] 3.3 mockData 服务保留在 src/services
- [x] 3.4 Tailwind 配置保留

### Phase 4: 构建和测试 ✅
- [x] 4.1 运行 pnpm dev 验证 ✅ 成功
- [ ] 4.2 测试扩展功能
- [ ] 4.3 更新文档

## Key Decisions
- 使用 src/ 目录结构 (Plasmo 支持)
- 保留 Zustand 状态管理
- 保留 Tailwind CSS
- 使用 ~src 路径别名
- 删除 vite.config.ts (Plasmo 内置)

## Files Created/Modified
- package.json: 添加 plasmo 依赖，配置 manifest
- popup.tsx: 新建入口文件
- tsconfig.json: 添加 ~src 路径别名
- 保留: src/*, tailwind.config.ts, postcss.config.js

## Build Status
✅ `pnpm dev` 运行成功
Extension re-packaged in 15162ms
