# TODO

## Features

- [ ] 扩展使用日志 — 记录扩展启用/禁用/安装/卸载历史，统计使用情况
- [ ] 多浏览器同步 — Groups、Rules、偏好设置跨 Chrome / Edge / Firefox 同步（具体方案待定，云端 / 浏览器自带 sync / 文件导出导入等都在考虑）
- [ ] 当前网站可用扩展识别 — 在当前网站上下文中，标记已安装扩展里哪些适用于此站点（基于权限、host matches、用户使用记录等）
- [ ] 云端推荐可用扩展 — 查询云端目录，推荐可以用在当前网站上的扩展（按域名匹配、社区评分、用户已安装情况过滤）
- [ ] 主题切换 — 支持深色 / 浅色 / 跟随系统三态，由 uiStore 管理；popup 与 dev:web preview 共用主题逻辑；FOUC 防抖（参考 tab-shelf 的 inline head script 方案）
- [ ] 设计风格切换 — 把当前 `punk-*` 极客风抽象成可切换的"主题包"，未来可以加入其它风格（如简约 / 拟物 / 卡通等）；建议把 `src/styles/globals.css` 里的 `punk-*` 变量改用 `data-style="punk"` 命名空间，再为每种风格各出一套；和主题切换（dark/light）正交（任一风格都要兼容深浅）
- [ ] `keyboard-shortcuts` 快捷键操作扩展 — 为常用操作（启用/禁用单个扩展、切换组、bisect 下一步、撤销/重做）配置浏览器命令快捷键 (用 chrome.commands API + Plasmo command handler；快捷键映射存 uiStore)
