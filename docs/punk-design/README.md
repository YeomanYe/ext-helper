# Punk Design System - ExtHelper

> A cyberpunk-inspired design system for the browser extension manager.

## Overview

This document describes the punk design system implemented for the ExtHelper browser extension. The design draws inspiration from cyberpunk aesthetics, terminal interfaces, and retro-futuristic visuals.

## Design Philosophy

- **Dark Mode Only**: The entire interface is designed around a deep dark background (#0F0F23), creating an immersive "hacker terminal" feel.
- **Neon Glow Effects**: Key interactive elements use colored glow effects reminiscent of neon signs.
- **Scanline Overlay**: A subtle CRT-style scanline effect adds depth and nostalgia.
- **Terminal Typography**: Uses monospace fonts (Press Start 2P, VT323, Fira Code) to evoke a command-line interface.
- **Wide Panel Layout**: Information-dense layout optimized for browser extension popup (660px width).
- **Binary Status**: Uses 1/0 instead of ON/OFF text for enabled state.

## Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#7C3AED` | Main accent, buttons, borders |
| Secondary | `#A78BFA` | Secondary text, hover states |
| CTA | `#F43F5E` | Destructive actions, warnings |
| Accent | `#22D3EE` | Highlights, links, icons |
| Success | `#10B981` | Online status, enabled state |
| Warning | `#FBBF24` | Warning indicators |
| Background | `#0F0F23` | Main background |
| Background Alt | `#1A1A2E` | Card backgrounds |
| Text Primary | `#E2E8F0` | Primary text |
| Text Secondary | `#94A3B8` | Secondary text |
| Text Muted | `#64748B` | Muted text |
| Neon Cyan | `#00FFFF` | HUD corners, decorative |
| Neon Pink | `#FF00FF` | Glitch effects |

## Typography

### Font Stack

```css
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Fira+Code:wght@400;500&display=swap');
```

| Font | Class | Usage | Size |
|------|-------|-------|------|
| Press Start 2P | `font-punk-heading` | Headings, buttons, logo | 6-10px |
| VT323 | `font-punk-body` | Body text, labels | 12-18px |
| Fira Code | `font-punk-code` | Version numbers, code | 10-14px |

### Usage Guidelines

```tsx
// Heading - uppercase, tracking-wide
<h3 className="font-punk-heading text-[8px] tracking-wide">EXTENSION_NAME</h3>

// Body text
<p className="font-punk-body text-xs">Description text</p>

// Version/Code
<span className="font-punk-code text-[10px]">v1.0.0</span>
```

## Layout Structure

### Popup Dimensions
- Width: 660px (max)
- Height: 600px (max)

### Main Sections (Top to Bottom)

1. **Header** (48px) - Logo + title + view mode toggle
2. **Search** (48px) - Terminal-style search bar with filter dropdown
3. **Sectors** (auto) - Horizontal chip group filters
4. **Content** (flex) - Extension card grid (flex-wrap)
5. **Footer** (32px) - Status bar with ON/OFF count

### View Modes

- **Card Mode**: Single column list with full details
- **Compact Mode**: Square cards in flex-wrap grid (~7 per row at 660px)

### Spacing System

| Name | Value | Usage |
|------|-------|-------|
| xs | 4px | Tight spacing |
| sm | 8px | Between related elements |
| md | 12px | Standard padding |
| lg | 16px | Section spacing |
| xl | 20px | Large gaps |

## Component Specifications

### SearchBar with Filter

**Specs:**
- Height: 44px (h-11)
- Filter dropdown on left side
- Terminal "$" prefix
- Search input on right (flex-1)

```tsx
<div className="flex items-center gap-3">
  {/* Filter Dropdown */}
  <button className="punk-btn h-11 px-3">
    {currentFilter.label} <ChevronDown />
  </button>

  {/* Search Input */}
  <div className="relative flex-1">
    <span className="absolute left-3 text-punk-accent">$</span>
    <input className="punk-input h-11 w-full pl-9" />
  </div>
</div>
```

### ExtensionCard - Card Mode (Full List)

```
┌─────────────────────────────────────────────────────────┐
│ [Icon]  NAME                    v1.0  ●  [1/0]  [⋮]   │
│         Description text...                             │
└─────────────────────────────────────────────────────────┘
```

**Specs:**
- Layout: flex items-center gap-3
- Icon: 40x40px with border
- Status dot: 12px, bottom-right of icon (pulsing green when enabled)
- Toggle: 1/0 binary switch
- Menu: Context menu on right-click

### ExtensionCard - Compact Mode (Square Grid)

```
┌─────────────────┐
│     [Icon]     │
│       ●        │
│     NAME       │
└─────────────────┘
```

**Specs:**
- Size: 84x84px (square)
- Layout: flex flex-col items-center justify-center
- Icon: 40x40px centered
- Status dot: 10px, bottom-right of icon
- Name: Truncated to 14 chars, centered below icon
- Click: Toggle extension

**Classes:**
```tsx
<div className="min-w-[84px] w-[84px] h-[84px] p-3">
  <img className="w-10 h-10" />
  <h3 className="font-punk-heading text-[6px] mt-1">NAME</h3>
</div>
```

### GroupDetailModal (Edit Mode)

**Specs:**
- Width: 400px
- Always enters edit mode when opened
- Two sections: IN SECTOR / NOT IN SECTOR
- Click extension to toggle group membership
- 1/0 toggle for enable state

```tsx
<div className="max-h-[560px] flex flex-col">
  {/* Header with search */}
  <div className="p-4 border-b">
    <Search />
  </div>

  {/* IN SECTOR - Highlighted */}
  <div className="border border-punk-success/50">
    <p className="text-punk-success">IN SECTOR [n]</p>
    <ExtensionItem /> {/* Green border, full opacity */}
  </div>

  {/* NOT IN SECTOR - Dimmed */}
  <div className="opacity-40">
    <p className="text-punk-text-muted">NOT IN SECTOR [n]</p>
    <ExtensionItem /> {/* Grayscale icon, muted text */}
  </div>
</div>
```

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
  <span className={cn(
    "absolute w-5 h-5 bg-punk-bg-alt border border-punk-border",
    "transition-transform duration-200",
    checked && "translate-x-5"
  )} />
</button>
```

### Sector Chips (Group Chips)

**Specs:**
- Display: Horizontal wrap
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

### Animations

| Class | Effect | Duration |
|-------|--------|----------|
| `animate-pulse` | Pulsing status indicator | 2s infinite |
| `animate-glitch` | Text skew/shift | 0.5s infinite |
| `animate-flicker` | CRT flicker | 0.15s infinite |

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

## File Structure

```
src/
├── styles/
│   └── globals.css           # Theme vars, effects, animations
├── components/
│   ├── popup/
│   │   └── Header.tsx       # Header, SearchBar, Footer
│   ├── extension/
│   │   └── ExtensionCard.tsx # Card and compact mode cards
│   ├── group/
│   │   └── GroupModal.tsx   # GroupDetailModal, GroupChip, CreateGroupChip
│   └── common/
│       ├── Button.tsx        # Punk button variants
│       ├── Input.tsx         # Terminal input
│       └── Switch.tsx        # Binary toggle switch
└── components/
    └── PopupPage.tsx         # Main popup layout
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
- Fixed grid columns in compact mode (use flex-wrap)
- Complex add mode for groups (use edit mode directly)

## Accessibility Notes

> **Note**: Cyberpunk style has limited accessibility:
> - Dark theme only
> - Neon colors with contrast limitations
> - Decorative animations

**Focus States:**
```css
*:focus-visible {
  outline: 2px solid #00FFFF;
  outline-offset: 2px;
  box-shadow: 0 0 10px #00FFFF;
}
```

**Reduced Motion:**
Animations respect `prefers-reduced-motion` when implemented.

## Changelog

### v2.0 - Compact Grid Redesign
- Panel width expanded to 660px
- Filter moved to dropdown select in SearchBar
- ON/OFF badge removed from ExtensionCard (status dot only)
- Compact mode uses flex-wrap layout
- Square cards (84x84px) instead of 88x100px
- Group modal redesigned with edit mode split view
- Two sections: IN SECTOR (highlighted) / NOT IN SECTOR (dimmed)
- Binary 1/0 toggle for enable state in group modal
