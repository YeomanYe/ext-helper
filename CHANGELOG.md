# Changelog

## 2.2.0

### Minor Changes

- 300810f: 新增主题强调色切换：在设置菜单中可选择 violet / cyan / emerald / rose / amber 等主色调，覆盖品牌主色变量，对所有明暗主题生效；偏好随 preferences 持久化并支持导入导出。

### Patch Changes

- Fix production popup crash (`Cannot find module 'react/jsx-runtime'`).

  Plasmo 0.90.5 production build emits a popup bundle that externalizes react,
  react-dom, and every `@/` business module to a sibling shared bundle that is
  never generated — so the shipped popup dies the instant it loads. Dev builds
  are unaffected, which is why this slipped through to v2.1.0.

  Workaround: post-build step re-bundles popup with Vite into a self-contained
  IIFE and rewrites `popup.html` to reference the new asset names. See
  `scripts/patch-popup-react.mjs`.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [2.1.0] - 2026-07-05

### Added

- 二分调试白名单(`bisect-whitelist`): 「Start Bisect」前可选择需要保护的扩展，并将偏好持久化；白名单中的扩展会在整轮二分过程中保持原状态，适合保护密码管理器、输入法、翻译工具等关键扩展。

### Changed

- 白名单管理入口移到 Header 设置菜单，ACTIONS 菜单只保留二分流程入口，配置和执行操作更清晰。

### Fixed

- 生产构建不再向浏览器控制台输出 AI 原始响应，避免泄露已安装扩展清单或当前访问 URL。

## [2.0.0] - 2026-05-31

### Added

- 当前网站扩展发现(`site-applicable-extensions`): 页面右侧新增可拖拽的悬浮触发按钮，点击后展开侧边发现面板，显示已安装扩展中适用于当前网站的扩展，并推荐未安装的相关扩展；适用性判断基于 AI 分析。
- 云端站点推荐(`cloud-extension-recommendation`): 安装用户无需登录即可查询当前网站适用扩展，默认服务部署在 Cloudflare Workers，并用 KV 限制每个匿名安装 ID 每天 3 次。
- 大模型快速分组(`ai-group-suggestions`): 在创建与更新分组面板中加入 AI 建议流程，可根据扩展元数据推荐候选扩展并一键加入分组。

## [1.3.0] - 2026-05-23

### Added

- 主题切换(`theme-toggle`): 新增深色 / 浅色 / 跟随系统三态主题切换，并采用最新 Xerox Zine Punk light 视觉效果。
