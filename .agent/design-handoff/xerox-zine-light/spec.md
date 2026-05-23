# Design Handoff: xerox-zine-light

## 页面目标
Ext Helper popup 的 light 模式重设为独立 punk 方向：像白纸复印的地下传单叠在工具控制台上，保留高密度管理效率，避免沿用当前粉紫霓虹网格。

## 设计方向
- Style name: Xerox Zine Punk
- 基调: off-white paper, black ink, acid green marker, hot pink warning tape, amber stamp.
- 视觉语言: 粗黑线、硬阴影、复印纸噪点、稀疏斜纹，不用紫色网格和大面积 cyan glow。
- 工具属性: 仍然是高密度 popup，不做营销化 hero，不增加解释性文案。

## Layout Structure
- 外层 popup: 680x600 固定工具窗口，背景像纸张，不出现当前 light 的规则网格。
- Header: 白纸 raised bar + 黑线下沿；logo 白底黑边，荧光绿字形；右侧工具组保持紧凑。
- Tabs/filter/group/cards: 保持现有信息结构，通过 token 改写材质、边框、shadow、状态色。
- Modals/menus: 白纸底、黑墨边框、hard shadow；hover/active 用酸绿或热粉底色。

## Design Tokens
- primary: #111111 / 黑墨主线
- secondary: #2d2d2d / 次级墨色
- cta/error: #ff2a6d / 热粉
- accent/success: #00a86b / 酸绿
- warning: #d97706 / 琥珀
- bg: #f8f4e8 / 复印纸
- surface-raised: #fffdf5 / 白纸
- surface-soft: #eee7d3 / 旧纸灰
- surface-inset: #e4dcc7 / 内凹纸面
- border: #111111 / 粗黑线
- shadow: 5px 5px 0 rgb(17 17 17 / 0.18)

## Interaction States
- normal: 黑边白纸，文字黑墨。
- hover: 酸绿淡底 + 黑线 shadow，避免蓝紫 glow。
- active/selected: 纯黑或酸绿强调，文字保持可读。
- danger: 热粉边/底，不能只靠颜色，保留 icon 与 label。
- focus: 黑色 outline + 酸绿外圈。

## Responsive Rules
- 当前 popup 固定 680x600，不改尺寸。
- 所有状态只改 token 和 light-only CSS，dark 模式保持原朋克终端方向。

## 验收点
- 必须截图: popup compact/card/detail/grid、settings menu、actions menu、extension context menu、details modal、remove confirm、import/export、group modal、rules、rule editor、logs、dark sanity。
- Light 截图应明显区别当前方案: 无紫色主导、无 cyan 网格、无大面积 glow。
- Header 左上 logo light 下白底可见，dark 下不劣化。

## 不要做什么
- 不沿用当前 light 模式的紫色主色、cyan 网格、粉紫 glow。
- 不增加新的布局复杂度或解释文案。
- 不改业务逻辑、数据结构、popup 宽高。
