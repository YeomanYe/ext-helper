# TODO

## Features

- [x] `extension-usage-log` 扩展使用日志 — 记录扩展启用/禁用/安装/卸载历史，统计使用情况
- [x] `config-log-import-export` 配置与日志导入导出 — 支持导出和导入 Groups、Rules、偏好设置等本地配置，以及扩展使用日志 (交互入口放在右上角显示模式切换控件右侧的图标；使用弹窗展示导入导出设置；导入前必须有预览和确认；日志部分依赖 extension-usage-log 的日志数据结构)
- [x] `theme-toggle` 主题切换 — 支持深色 / 浅色 / 跟随系统三态 (由 uiStore 管理；popup 与 dev:web preview 共用主题逻辑；FOUC 防抖参考 tab-shelf 的 inline head script 方案)
- [x] `ai-group-suggestions` 大模型快速分组 — 在创建与更新分组面板中用大模型快速选择合适的扩展 (在创建/更新分组面板增加机器人图标按钮；点击后根据扩展名称、描述、权限和当前分组目标推荐候选扩展；设置中支持本地模型和远程模型；大模型接入逻辑借鉴 /Users/ym/Documents/projects/ai-bookmark)
- [ ] `site-applicable-extensions` 当前网站可用扩展识别 — 在当前网站上下文中，标记已安装扩展里哪些适用于此站点 (基于权限、host matches、用户使用记录)
- [ ] `cloud-extension-recommendation` 云端推荐可用扩展 — 查询云端目录，推荐可以用在当前网站上的扩展 (按域名匹配、社区评分、用户已安装情况过滤)
- [ ] `keyboard-shortcuts` 快捷键操作扩展 — 为常用操作（启用/禁用单个扩展、切换组、bisect 下一步、撤销/重做）配置浏览器命令快捷键 (用 chrome.commands API + Plasmo command handler；快捷键映射存 uiStore)
- [ ] `style-pack-switching` 设计风格切换 — 把当前 punk 极客风抽象成可切换的"主题包"，未来可以加入其它风格如简约 / 拟物 / 卡通 (建议把 src/styles/globals.css 里 punk-* 变量改用 data-style="punk" 命名空间；与主题切换 dark/light 正交，任一风格都要兼容深浅)
- [ ] `multi-browser-sync` 多浏览器同步 — Groups、Rules、偏好设置跨 Chrome / Edge / Firefox 同步 (方案待定：云端 / 浏览器自带 sync / 文件导出导入)
