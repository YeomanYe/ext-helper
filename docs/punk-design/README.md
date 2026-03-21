# Punk Design System - ExtHelper

> A cyberpunk-inspired design system for the browser extension manager.

## Overview

This document describes the punk design system implemented for the ExtHelper browser extension. The design draws inspiration from cyberpunk aesthetics, terminal interfaces, and retro-futuristic visuals.

## Design Philosophy

- **Dark Mode Only**: The entire interface is designed around a deep dark background (#0F0F23), creating an immersive "hacker terminal" feel.
- **Neon Glow Effects**: Key interactive elements use colored glow effects reminiscent of neon signs.
- **Scanline Overlay**: A subtle CRT-style scanline effect adds depth and nostalgia.
- **Terminal Typography**: Uses monospace fonts (Press Start 2P, VT323, Fira Code) to evoke a command-line interface.
- **Compact Single Column**: Information-dense layout optimized for browser extension popup (380px width).

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
| Press Start 2P | `font-punk-heading` | Headings, buttons, logo | 8-10px |
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
- Width: 380px (fixed)
- Height: 600px (max)

### Main Sections (Top to Bottom)

1. **Header** (48px) - Logo + title + settings
2. **Search** (48px) - Terminal-style search bar
3. **Sectors** (auto) - Horizontal chip group filters
4. **Filters** (40px) - Quick filter buttons
5. **Content** (flex) - Extension card list (single column)
6. **Footer** (32px) - Status bar

### Spacing System

| Name | Value | Usage |
|------|-------|-------|
| xs | 4px | Tight spacing |
| sm | 8px | Between related elements |
| md | 12px | Standard padding |
| lg | 16px | Section spacing |
| xl | 20px | Large gaps |

## Component Specifications

### ExtensionCard (Single Row Layout)

```
┌─────────────────────────────────────────────────────────┐
│ [Icon]  NAME              v1.0  ●ON  [1/0] [⋮]        │
│         Description text...                             │
└─────────────────────────────────────────────────────────┘
```

**Specs:**
- Height: auto (min ~48px)
- Padding: p-2.5
- Gap: gap-3
- Icon: 40x40px with border
- Status dot: 10px, bottom-right of icon
- Badge: "ON"/"OFF" inline with status dot
- Switch: 1/0 binary toggle
- Menu: MoreVertical icon

**Classes:**
```tsx
<div className="flex items-center gap-3 p-2.5">
  {/* Icon */}
  <img className="h-10 w-10 border object-cover" />

  {/* Info */}
  <div className="flex-1 min-w-0">
    <h3 className="font-punk-heading text-[8px]" />
    <p className="font-punk-body text-xs" />
  </div>

  {/* Actions */}
  <div className="flex items-center gap-2">
    <span>ON/OFF</span>
    <Switch />
    <button>⋮</button>
  </div>
</div>
```

### SearchBar

**Specs:**
- Height: 44px (h-11)
- Prompt: "$" terminal prefix
- Placeholder: "SEARCH_EXTENSIONS..."

```tsx
<div className="relative">
  <span className="absolute left-3 top-1/2 font-punk-body text-punk-accent">$</span>
  <input className="punk-input h-11 w-full pl-9" />
</div>
```

### QuickFilters

**Specs:**
- Buttons: ALL | ON | OFF
- Style: Uppercase, monospace

```tsx
<div className="flex gap-1">
  <button className="punk-btn px-3 py-1">
    {active ? "punk-btn-primary" : "bg-punk-bg-alt"}
  </button>
</div>
```

### Sector Chips (Group Chips)

**Specs:**
- Display: Horizontal wrap
- Content: Color dot + name + count
- Active: Purple glow background

```tsx
<button className="flex items-center gap-2 px-3 py-2">
  <div className="w-2 h-2" style={{ backgroundColor: color }} />
  <span className="font-punk-heading text-[9px]">NAME</span>
  <span className="font-punk-code">[3]</span>
</button>
```

### Switch Component

**Specs:**
- Size: 24x44px (h-6 w-11)
- Display: Binary 1/0 instead of on/off
- Glow: Green glow when on

```tsx
<button className="border-2 border-punk-success bg-punk-success/20 shadow-[0_0_10px_var(--punk-success)]">
  <span>1</span>  {/* on */}
  <span>0</span>  {/* off */}
  <span className="translate-x-5" /> {/* thumb */}
</button>
```

## Effects

### Neon Glow Classes

```css
.shadow-neon-purple { box-shadow: 0 0 5px #7C3AED, 0 0 20px #7C3AED, 0 0 40px #7C3AED; }
.shadow-neon-cyan { box-shadow: 0 0 5px #00FFFF, 0 0 20px #00FFFF; }
.shadow-neon-cta { box-shadow: 0 0 5px #F43F5E, 0 0 20px #F43F5E; }
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
| `punk-border` | Glowing purple border |
| `hud-corner` | HUD-style corner decorations |
| `glitch` | Glitch animation on text |

## File Structure

```
src/
├── styles/
│   └── globals.css           # Theme vars, effects, animations
├── components/
│   ├── popup/
│   │   └── Header.tsx       # Header, SearchBar, QuickFilters, Footer
│   ├── extension/
│   │   └── ExtensionCard.tsx # Single-row extension card
│   ├── group/
│   │   ├── GroupItem.tsx    # Group list item
│   │   └── GroupModal.tsx   # Group detail modal + chips
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
    bg: '#0F0F23',
    bg-alt: '#1A1A2E',
    // ...
  }
},
fontFamily: {
  'punk-heading': ['"Press Start 2P"', 'monospace'],
  'punk-body': ['"VT323"', 'monospace'],
  'punk-code': ['"Fira Code"', 'monospace'],
},
boxShadow: {
  'neon-purple': '...',
  'neon-cyan': '...',
  'neon-cta': '...',
}
```

## Anti-Patterns

The punk design intentionally avoids:
- Light mode (dark only)
- Rounded corners (sharp edges preferred)
- Subtle shadows (prefer neon glow effects)
- Sans-serif fonts (monospace required)
- Emoji icons (use Lucide SVG icons)
- Multi-column card grids (single column for popup)
- Long status text ("ONLINE" → "ON", "OFFLINE" → "OFF")

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
