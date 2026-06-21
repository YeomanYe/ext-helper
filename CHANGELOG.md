# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [2.1.0] - Unreleased

### Added

- 分组支持拖拽排序(`group-drag-reorder`): 分组列表可直接拖动调整顺序。
- 规则面板 `find` 快捷键聚焦搜索(`rules-find-shortcut`): 规则页自动捕获 `find` 快捷键并聚焦到搜索框。
- 深色主题新增「深蓝」配色变体(`deep-blue-theme`)。

### Fixed

- 修复 popup 闪烁效果。
- 优化深色主题配色。
- 修复 Firefox 扩展图标归一化与运行时识别。
- 设置页 API base URL 占位文案改为通用文案。

## [2.0.0] - 2026-05-31

### Added

- 当前网站扩展发现(`site-applicable-extensions`): 页面右侧新增可拖拽的悬浮触发按钮，点击后展开侧边发现面板，显示已安装扩展中适用于当前网站的扩展，并推荐未安装的相关扩展；适用性判断基于 AI 分析。
- 云端站点推荐(`cloud-extension-recommendation`): 安装用户无需登录即可查询当前网站适用扩展，默认服务部署在 Cloudflare Workers，并用 KV 限制每个匿名安装 ID 每天 3 次。
- 大模型快速分组(`ai-group-suggestions`): 在创建与更新分组面板中加入 AI 建议流程，可根据扩展元数据推荐候选扩展并一键加入分组。

## [1.3.0] - 2026-05-23

### Added

- 主题切换(`theme-toggle`): 新增深色 / 浅色 / 跟随系统三态主题切换，并采用最新 Xerox Zine Punk light 视觉效果。
