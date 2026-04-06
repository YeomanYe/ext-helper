# Punk Design System - ExtHelper

> A cyberpunk-inspired design system for the browser extension manager.

## Overview

This document describes the punk design system implemented for the ExtHelper browser extension. The design draws inspiration from cyberpunk aesthetics, terminal interfaces, and retro-futuristic visuals.

## Design Philosophy

- **Dark Mode Only**: The entire interface is designed around a deep dark background (#0F0F23), creating an immersive "hacker terminal" feel.
- **Neon Glow Effects**: Key interactive elements use colored glow effects reminiscent of neon signs.
- **Scanline Overlay**: A subtle CRT-style scanline effect adds depth and nostalgia.
- **Terminal Typography**: Uses monospace fonts (Press Start 2P, VT323, Fira Code) to evoke a command-line interface.
- **Binary Status**: Uses 1/0 instead of ON/OFF text for enabled state.
- **Minimal Animations**: Prefer static visual effects over continuous animations for better UX.

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#7C3AED` | Main accent, buttons, borders |
| Secondary | `#A78BFA` | Secondary text, hover states |
| CTA | `#F43F5E` | Destructive actions, warnings |
| Accent | `#22D3EE` | Highlights, links, icons |
| Success | `#10B981` | Online status, enabled state |
| Warning | `#FBBF24` | Warning indicators (Bisect) |
| Background | `#0F0F23` | Main background |
| Background Alt | `#1A1A2E` | Card backgrounds |
| Text Primary | `#E2E8F0` | Primary text |
| Text Secondary | `#94A3B8` | Secondary text |
| Text Muted | `#78859B` | Muted text (WCAG AA compliant) |
| Neon Cyan | `#00FFFF` | HUD corners, logo, decorative |
| Neon Pink | `#FF00FF` | Glitch effects |

## Typography

### Font Stack

```css
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
```

| Font | Class | Usage | Size |
|------|-------|-------|------|
| Noto Sans SC + JetBrains Mono | `font-punk-heading` | Headings, buttons, logo | 6-13px |
| Noto Sans SC + JetBrains Mono | `font-punk-body` | Body text, labels | 12-18px |
| JetBrains Mono | `font-punk-code` | Version numbers, code | 10-14px |

Noto Sans SC provides CJK (Chinese) support. JetBrains Mono provides the monospace terminal aesthetic.

### Usage Guidelines

```tsx
// Heading - uppercase, tracking-wide
<h3 className="font-punk-heading text-[12px] tracking-wider uppercase">EXTENSION_NAME</h3>

// Body text
<p className="font-punk-body text-sm">Description text</p>

// Version/Code
<span className="font-punk-code text-[10px]">v1.0.0</span>
```

## Layout Structure

### Popup Dimensions
- Height: 600px (fixed via `h-[600px]`)
- Width: determined by browser popup

### Main Sections (Top to Bottom)

1. **Header** (~60px) - Cyberpunk logo, title, subtitle, view mode toggle (GRID/CARD/DETAIL)
2. **TabBar** - EXTENSIONS / RULES tabs + ACTIONS dropdown
3. **Search** (48px) - Filter dropdown (ALL/ON/OFF) + terminal-style search bar
4. **BisectBanner** (auto) - Only visible during active bisect session
5. **GroupsBar** (auto) - Horizontal chip group filters with power toggle
6. **Content** (flex) - Extension grid/list or RuleManager
7. **Footer** (~40px) - Status bar with progress and LIVE indicator

### View Modes

- **Compact Mode (GRID)**: Square cards in CSS grid `auto-fill, minmax(80px, 1fr)`
- **Card Mode (CARD)**: Single column list with full details and toggle switch
- **Detail Mode (DETAIL)**: Single column with permissions, install type, action buttons

### Spacing System

| Name | Value | Usage |
|------|-------|-------|
| xs | 4px | Tight spacing |
| sm | 8px | Between related elements |
| md | 12px | Standard padding |
| lg | 16px | Section spacing |
| xl | 20px | Large gaps |

## Component Specifications

### Header

```
┌─────────────────────────────────────────────────────────────────────┐
│ [E]  EXTHELPER                              [GRID][CARD][DETAIL]   │
│      EXTENSION_MGR_v2.0                                            │
└─────────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Border: 2px solid primary color
- Background: punk-bg
- Padding: px-4 py-3
- HUD corner decorations
- Scanline animation

**Logo:**
- Size: 40x40px
- Border: 2px solid neon-cyan
- Content: "E" in font-punk-heading
- Glow effect: blur-md neon-cyan/30

**Title:**
- Text: "EXTHELPER"
- Color: neon-cyan
- Font: font-punk-heading text-xs

**Subtitle:**
- Text: "EXTENSION_MGR_v2.0"
- Color: text-muted
- Font: font-punk-body

**View Mode Toggle:**
- Three buttons: GRID / CARD / DETAIL
- Active state: bg-punk-primary/30 text-punk-accent border-punk-primary/50
- Inactive: text-punk-text-muted

```tsx
<header className="relative flex items-center justify-between border-b-2 border-punk-primary bg-punk-bg px-4 py-3 hud-corner">
  <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
    <div className="w-full h-1 bg-punk-accent animate-scanline" />
  </div>
  {/* Logo + Title */}
  {/* View mode buttons: GRID / CARD / DETAIL */}
</header>
```

### TabBar

```
┌─────────────────────────────────────────────────────────────────────┐
│  [EXTENSIONS]  [RULES]                               [ACTIONS ▼]  │
└─────────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Active tab: text-punk-accent border-b-2 border-punk-accent
- Inactive: text-punk-text-muted
- ACTIONS dropdown aligned right

### Footer

```
┌─────────────────────────────────────────────────────────────────────┐
│ SYS_STATUS: 3/10 ONLINE | 30%_ACTIVE                    ● LIVE    │
└─────────────────────────────────────────────────────────────────────┘
```

**Specs:**
- Border: 2px solid primary (top)
- Progress bar: bottom edge, shows enabled percentage
- LIVE indicator: green dot + text

### SearchBar with Filter

**Specs:**
- Height: 44px (h-11)
- Filter dropdown on left side (ALL / ON / OFF)
- Terminal "$" prefix
- Search input on right (flex-1)
- Clear button when has value

```tsx
<div className="flex items-center gap-3">
  <button className="punk-btn h-11 px-3">
    {currentFilter.label} <ChevronDown />
  </button>
  <div className="relative flex-1">
    <span className="absolute left-3 text-punk-accent">$</span>
    <input className="punk-input h-11 w-full pl-9" />
  </div>
</div>
```

### ExtensionCard - Compact Mode (Square Grid)

```
┌─────────────────┐
│     [Icon]      │
│       ●         │
│     NAME        │
└─────────────────┘
```

**Specs:**
- Size: aspect-square (proportional)
- Grid: `grid-cols-[repeat(auto-fill,minmax(80px,1fr))]`
- Layout: flex flex-col items-center justify-center
- Icon: 40x40px centered
- Status dot: 2.5px (w-2.5 h-2.5), bottom-right of icon
- Name: Truncated to 14 chars, centered below icon, font-punk-heading text-[10px]
- Click: Toggle extension

### ExtensionCard - Card Mode (List)

```
┌─────────────────────────────────────────────────────────┐
│ [Icon]  NAME                    v1.0  ●  [1/0]        │
│         Description text...                             │
└─────────────────────────────────────────────────────────┘
```

**Specs:**
- Layout: flex items-center gap-3, min-h-[60px]
- Icon: 40x40px with border
- Status dot: 3px (w-3 h-3), bottom-right of icon
- Toggle: 1/0 binary switch (right side)
- Name: font-punk-heading text-[12px]
- Description: font-punk-body text-sm, truncated
- Version: font-punk-code text-[10px] text-punk-accent

### ExtensionCard - Detail Mode (Full Info)

```
┌─────────────────────────────────────────────────────────┐
│ [Icon]  NAME                    v1.0            [1/0]  │
│    ●    [ACTIVE] development                           │
│         Description text (full)...                     │
│                                                         │
│ ┌─ PERMISSIONS (5) ──────────────────────────────────┐ │
│ │ [perm1] [perm2] [perm3] [perm4] [perm5]            │ │
│ └────────────────────────────────────────────────────┘ │
│                                    [OPTIONS] [REMOVE]  │
└─────────────────────────────────────────────────────────┘
```

**Specs:**
- Layout: flex flex-col, full width
- Icon: 56x56px (w-14 h-14)
- Status dot: 3.5px (w-3.5 h-3.5)
- Status badge: [ACTIVE] green / [INACTIVE] muted
- Permissions: flex-wrap, max 6 shown + "+n more"
- Action buttons: OPTIONS + REMOVE at bottom

### BisectBanner

```
┌─────────────────────────────────────────────────────────┐
│  BISECT STEP 3                    [Good] [Bad] [Cancel] │
│  Good = issue disappeared, Bad = still present          │
│  Candidates 4 · Testing 2                               │
└─────────────────────────────────────────────────────────┘
```

**Specs:**
- Border: border-punk-warning/40
- Background: bg-punk-bg-alt
- Title: font-punk-heading text-[12px] text-punk-warning
- Good button: border-punk-success, text-punk-success
- Bad button: border-punk-cta, text-punk-cta
- Cancel button: border-punk-border, text-punk-text-muted

### ExtensionsActionsMenu

```
┌────────────────┐
│ Start Bisect   │
│ Enable All     │
│ Disable All    │
│ Undo [3]       │
│ Redo [1]       │
└────────────────┘
```

**Specs:**
- Trigger: "ACTIONS" button with chevron
- Width: w-40
- Items: font-punk-heading text-[11px] uppercase
- Disabled items: opacity-40, cursor-not-allowed

### GroupDetailModal (Edit Mode)

**Specs:**
- Width: 480px, Height: 575px
- Always enters edit mode when opened
- Two sections: IN SECTOR / NOT IN SECTOR
- Click extension to toggle group membership
- 1/0 toggle for enable state (IN SECTOR only)

```tsx
<div className="w-[480px] h-[575px] border border-punk-border bg-punk-bg-alt">
  {/* GroupEditorPanel: name edit, icon upload, search, filter */}
  {/* GroupExtensionPicker: IN SECTOR (highlighted) / NOT IN SECTOR (dimmed) */}
  {/* Footer: DELETE | CANCEL / CLOSE | CONFIRM */}
</div>
```

### ExtensionContextMenu

```
┌─────────────────────┐
│ ⚡ ENABLE/DISABLE   │
│ ⚙ OPTIONS          │  ← only if optionsUrl exists
│ ℹ DETAILS          │
│ 🗑 REMOVE           │
└─────────────────────┘
```

**Specs:**
- Rendered via Portal to document.body
- Position: calculated by useContextMenuPosition hook
- Width: 160px (compact) / 176px (card/detail)
- Disabled items have opacity-40

### ExtensionDetailsModal

**Specs:**
- Width: max-w-xl
- Shows: icon, name, version, install type, status badge
- Sections: description, permissions list
- Links: homepage, options page

### Switch Component

**Specs:**
- Size: h-6 w-11 (24x44px)
- Display: Binary 1/0 instead of on/off
- Glow: Green glow when ON (value=1)

```tsx
<button className={cn(
  "h-6 w-11 border-2 transition-all",
  checked
    ? "border-punk-success bg-punk-success/20 shadow-[0_0_10px_var(--punk-success)]"
    : "border-punk-border bg-punk-bg"
)}>
  <span className={cn("text-[10px]", checked ? "text-punk-success" : "text-punk-text-muted")}>
    {checked ? "1" : "0"}
  </span>
</button>
```

### Sector Chips (Group Chips)

**Specs:**
- Display: Horizontal flex-wrap
- Content: Color dot + name + count + power toggle
- Click: Open group detail modal
- Power icon: Toggle all in sector

```tsx
<div className="flex items-center gap-2 px-3 py-2 border bg-punk-bg-alt">
  <div className="w-2 h-2" style={{ backgroundColor: color }} />
  <span className="font-punk-heading text-[9px]">NAME</span>
  <span className="font-punk-code text-[10px] text-punk-accent">[3]</span>
  <button><Power className="h-3.5 w-3.5" /></button>
</div>
```

## Effects

### Neon Glow Classes

```css
.shadow-neon-purple { box-shadow: 0 0 5px #7C3AED, 0 0 20px #7C3AED, 0 0 40px #7C3AED; }
.shadow-neon-cyan { box-shadow: 0 0 5px #00FFFF, 0 0 20px #00FFFF; }
.shadow-neon-cta { box-shadow: 0 0 5px #F43F5E, 0 0 20px #F43F5E; }
.shadow-neon-success { box-shadow: 0 0 5px #10B981, 0 0 20px #10B981; }
```

### Text Glow Classes

```css
.neon-text { text-shadow: 0 0 5px #7C3AED, 0 0 10px #7C3AED; }
.neon-text-cyan { text-shadow: 0 0 5px #00FFFF, 0 0 10px #00FFFF; }
.neon-text-pink { text-shadow: 0 0 5px #FF00FF, 0 0 10px #FF00FF; }
```

### Animations (Optional)

Animations are optional and can be toggled. Prefer static effects for better UX.

| Class | Effect | Usage |
|-------|--------|-------|
| `animate-pulse` | Pulsing indicator | Status dots |
| `animate-pulse-neon` | Neon pulsing | Status dots (enabled) |
| `animate-glitch` | Text skew/shift | Decorative titles |
| `animate-flicker` | CRT flicker | CRT effect |
| `animate-scanline` | Moving scanline | Header decoration |

### Scanline Overlay (Global)

Applied via `body::before` pseudo-element:
```css
body::before {
  content: "";
  background: repeating-linear-gradient(0deg, rgba(0,0,0,0.15), rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px);
}
```

## CSS Utilities Reference

| Class | Purpose |
|-------|---------|
| `punk-input` | Terminal-style input field |
| `punk-btn` | Button base with monospace font |
| `punk-btn-primary` | Primary button with neon glow |
| `punk-btn-secondary` | Secondary button variant |
| `punk-btn-accent` | Accent button variant |
| `punk-btn-destructive` | Destructive (CTA) button variant |
| `punk-border` | Glowing purple border |
| `punk-border-cyan` | Glowing cyan border |
| `hud-corner` | HUD-style corner decorations |
| `glitch` | Glitch animation on text |
| `neon-text` | Neon text glow effect |
| `neon-text-cyan` | Cyan neon text glow |
| `neon-text-pink` | Pink neon text glow |
| `animate-pulse-neon` | Pulsing neon animation |
| `animate-scanline` | Moving scanline decoration |

## File Structure

```
src/
├── styles/
│   └── globals.css              # Theme vars, effects, animations
├── components/
│   ├── popup/
│   │   ├── Header.tsx           # Header, SearchBar, QuickFilters, Footer
│   │   ├── ExtensionsActionsMenu.tsx  # Actions dropdown
│   │   └── BisectBanner.tsx     # Bisect status banner
│   ├── extension/
│   │   ├── ExtensionCard.tsx    # Compact, Card, and Detail mode cards
│   │   ├── ExtensionContextMenu.tsx   # Right-click context menu (Portal)
│   │   ├── ExtensionDetailsModal.tsx  # Extension details modal (Portal)
│   │   └── ExtensionList.tsx    # Extension list container
│   ├── group/
│   │   ├── GroupModal.tsx       # GroupModal (create/edit mode)
│   │   ├── GroupsBar.tsx        # Horizontal group chips container
│   │   ├── GroupChips.tsx       # GroupChip + CreateGroupChip
│   │   ├── GroupEditorPanel.tsx # Name/icon/search editor
│   │   └── GroupExtensionPicker.tsx  # IN/NOT IN SECTOR picker
│   ├── rules/
│   │   ├── RuleManager.tsx      # Rule management main view
│   │   ├── RuleList.tsx         # Rule list
│   │   ├── RuleCard.tsx         # Rule card
│   │   ├── RuleEditor.tsx       # Rule editor modal
│   │   ├── ConditionBuilder.tsx # Condition group editor
│   │   ├── ActionBuilder.tsx    # Action editor
│   │   └── RuleBadges.tsx       # Condition/action summary badges
│   └── common/
│       ├── Button.tsx           # Punk button variants
│       ├── Input.tsx            # Terminal input
│       ├── Switch.tsx           # Binary toggle switch (1/0)
│       └── ConfirmDialog.tsx    # Confirmation dialog
└── components/
    └── PopupPage.tsx            # Main popup layout (Tab navigation)
```

## Tailwind Config

Key extensions from default config:

```js
colors: {
  punk: {
    primary: '#7C3AED',
    secondary: '#A78BFA',
    cta: '#F43F5E',
    accent: '#22D3EE',
    success: '#10B981',
    warning: '#FBBF24',
    bg: '#0F0F23',
    'bg-alt': '#1A1A2E',
    'neon-pink': '#FF00FF',
    'neon-cyan': '#00FFFF',
    // ...
  }
},
fontFamily: {
  'punk-heading': ['"Press Start 2P"', 'monospace'],
  'punk-body': ['"VT323"', 'monospace'],
  'punk-code': ['"Fira Code"', 'monospace'],
},
boxShadow: {
  'neon-purple': '0 0 5px #7C3AED, 0 0 20px #7C3AED, 0 0 40px #7C3AED',
  'neon-cyan': '0 0 5px #00FFFF, 0 0 20px #00FFFF',
  'neon-cta': '0 0 5px #F43F5E, 0 0 20px #F43F5E',
  'neon-success': '0 0 5px #10B981, 0 0 20px #10B981',
}
```

## Anti-Patterns

The punk design intentionally avoids:
- Light mode (dark only)
- Rounded corners (sharp edges preferred)
- Subtle shadows (prefer neon glow effects)
- Sans-serif fonts (monospace required)
- Emoji icons (use Lucide SVG icons)
- ON/OFF text labels (use 1/0 binary)
- Fixed grid columns in compact mode (use CSS grid auto-fill)
- Complex add mode for groups (use edit mode directly)
- Excessive animations (keep UI responsive)

## Accessibility Notes

> **Note**: Cyberpunk style has limited accessibility:
> - Dark theme only
> - Neon colors with contrast limitations
> - Decorative animations (respect prefers-reduced-motion)

**Focus States:**
```css
*:focus-visible {
  outline: 2px solid #00FFFF;
  outline-offset: 2px;
  box-shadow: 0 0 10px #00FFFF;
}
```

**Reduced Motion:**
All animations are disabled when `prefers-reduced-motion: reduce` is set, via a global CSS media query in `globals.css`.

## Changelog

### v3.0 - Rules & Bisect Update

**New Components:**
- TabBar: EXTENSIONS / RULES tab navigation
- BisectBanner: Bisect session status and controls
- ExtensionsActionsMenu: Batch operations dropdown
- ExtensionContextMenu: 4-item right-click menu (Portal)
- ExtensionDetailsModal: Full extension info dialog (Portal)
- RuleManager: Rule CRUD interface
- RuleEditor: Condition group + action builder
- ConditionBuilder: Domain patterns + schedule editor
- RuleBadges: Condition/action summary display

**View Modes:**
- Added Detail mode (3 modes total: GRID/CARD/DETAIL)
- Detail mode shows permissions, install type, action buttons

**Layout:**
- Added TabBar between Header and SearchBar
- Added BisectBanner (conditional)
- ACTIONS dropdown in TabBar

**Group Modal:**
- Size: 480×575px
- GroupEditorPanel: name edit, icon upload
- GroupExtensionPicker: IN/NOT IN SECTOR split view

### v2.0 - Punk Redesign

**Layout:**
- Header with cyberpunk logo and subtitle
- Footer with progress bar and LIVE indicator
- Scanline decoration in header

**Search & Filters:**
- Filter moved to dropdown select in SearchBar
- Terminal "$" prompt styling

**Extension Cards:**
- Compact mode uses CSS grid auto-fill layout
- Square cards (aspect-square)
- ON/OFF badge removed (status dot only)
- 1/0 binary toggle switch

**Group Management:**
- Group modal redesigned with edit mode split view
- Two sections: IN SECTOR (highlighted) / NOT IN SECTOR (dimmed)
- Binary 1/0 toggle for enable state in group modal
- Simplified workflow: click to toggle membership

**Styling:**
- Neon cyan color for logo and title
- HUD corner decorations
- Static UI preferred over animations
