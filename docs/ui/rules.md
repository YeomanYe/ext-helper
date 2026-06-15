# UI / 设计系统规则

> 视觉与样式的硬规则。完整布局 / 组件设计稿见 [`design.md`](design.md)；主题文件
> [`../punk-design/`](../punk-design/)。

## Punk 设计系统（暗色唯一）

- 样式**只用 `punk-` 前缀的设计系统类**（如 `punk-bg`、`punk-accent`、`punk-text-primary`），
  定义在 `src/styles/globals.css`。
- **禁止魔法色值 / 魔法间距** —— 需要新值先进设计系统（globals.css / theme），不在组件里硬编码。
- **仅暗色主题**：背景 `#0F0F23`、主文字 `#E2E8F0`；不做亮色分支。

## 设计 token（改样式对齐这些；完整表见 design.md §6）

- **色彩（语义 → 用途 → hex）**：Primary `#7C3AED`(主色/边框) · Secondary `#A78BFA`(次文字/hover) ·
  CTA `#F43F5E`(危险) · Accent `#22D3EE`(高亮/链接) · Success `#10B981`(启用) · Warning `#FBBF24`(Bisect) ·
  Background `#0F0F23` · Background Alt `#1A1A2E`(卡片) · Text Primary/Secondary/Muted `#E2E8F0`/`#94A3B8`/`#64748B`
- **字体**：标题/按钮 `font-punk-heading`(Press Start 2P) · 正文 `font-punk-body`(VT323) · 版本/代码 `font-punk-code`(Fira Code)
- **间距**：按钮 `gap-1`~`gap-2` · 卡片 `p-2.5`~`p-3` · 区域 `gap-2`~`gap-3` · 边框 `border`~`border-2`

## 动画规范

- 通用状态变化 `transition-all` 200ms；hover 颜色 `transition-colors` 150ms。
- 状态点脉冲 `animate-pulse-neon`、Header 扫描线 `animate-scanline`、弹窗背景 `backdrop-blur-sm`。

## 可访问性（必须）

- **焦点可见**：`*:focus-visible` 用 2px `#00FFFF` outline + offset + glow（见 design.md §9.1），不要移除 outline。
- **尊重 `prefers-reduced-motion`**：所有动画在用户开启减少动态时关闭。

## class 组合

- 条件 class 用 `cn()`（`clsx` + `tailwind-merge`），避免手拼字符串导致 Tailwind 冲突类不被合并。
- 组件 variant 用 `class-variance-authority`（CVA）；**业务差异不要做成 variant**（variant 只表达视觉维度）。

## 图标

- 用 `lucide-react`，不引入零散 svg 文件。扩展图标资产规则见 [extension 域](../extension/rules.md#6-图标资产)。
