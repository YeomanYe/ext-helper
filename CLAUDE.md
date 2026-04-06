# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Ext Helper** is a browser extension manager (Chrome/Firefox/Edge) built with Plasmo framework. It provides extension enable/disable toggling, grouping, undo/redo, bisect debugging (binary search for problematic extensions), and a rule engine that auto-manages extensions based on domain/schedule conditions.

## Commands

```bash
# Development
pnpm dev            # Plasmo dev (loads as real browser extension)
pnpm dev:web        # Vite dev server on port 4173 (web preview with mock data)
pnpm build          # Plasmo production build
pnpm build:web      # Vite production build (web preview)
pnpm test           # vitest (watch mode)
pnpm test -- --run  # vitest single run
```

## Architecture

### Dual Runtime Modes

The app runs in two modes controlled by `isDevMode()` from `src/services/mockData.ts`:
- **Extension mode** (`pnpm dev`): Uses Plasmo framework, real `chrome.management.*` APIs via `browserAdapter`
- **Web preview mode** (`pnpm dev:web`): Uses Vite, `devStorage` (localStorage-backed in-memory store) with mock data. No browser extension APIs available.

All data access goes through repository classes (`src/services/*Repo.ts`) that branch on `isDevMode()`.

### Path Aliases

- `@/*` → `src/*` (Vite/tsconfig)
- `~src/*` → `src/*` (Plasmo compatibility)

### State Management

Zustand stores in `src/stores/`:
- **extensionStore** — Extensions list, filter/search/sort, undo/redo history (snapshot-based), bisect session
- **groupStore** — Extension groups with CRUD, drag-and-drop
- **ruleStore** — Automation rules CRUD
- **uiStore** — Theme, view mode, preferences

All store mutations use **optimistic updates** via `runOptimisticMutation()` in `src/stores/optimistic.ts`: apply state immediately, persist async, rollback on failure.

### Bisect System

Binary search to find a problematic extension (`src/stores/bisectUtils.ts`, `extensionStore`). Splits enabled extensions into halves, user marks "good"/"bad", narrows down to the culprit. Session persisted to survive popup close/reopen.

### Rule Engine

`src/rules/` — Automation system that enables/disables extensions based on conditions:
- **ConditionGroup**: domains (with match modes: exact/contains/wildcard/regex) + optional schedule (days + time range)
- **Actions**: enable/disable individual extensions or entire groups
- **Background service** (`src/background/index.ts`): Listens to tab URL changes and alarms to trigger rules automatically

### Repository Pattern

`src/services/` — Data access layer:
- `extensionsRepo` — Extension CRUD + bisect session persistence
- `groupsRepo` — Group CRUD
- `rulesRepo` — Rule CRUD
- `preferencesRepo` — UI preferences
- `devStorage` — In-memory + localStorage mock for web preview mode
- `browser/adapter.ts` — Cross-browser API abstraction (Chrome/Firefox/Edge)

### Component Organization

- `src/components/popup/` — Top-level popup shell (Header, Footer, SearchBar, BisectBanner)
- `src/components/extension/` — Extension cards, context menu, details modal
- `src/components/group/` — Group management (modal, bar, chips, editor)
- `src/components/rules/` — Rule editor, condition builder, action builder
- `src/components/common/` — Shared UI primitives (Button, Input, Switch, ConfirmDialog)

### Styling

Tailwind CSS with a custom "punk" design system. Classes prefixed with `punk-` (e.g., `punk-bg`, `punk-accent`, `punk-text-primary`). Defined in `src/styles/globals.css`.

## Key Patterns

- **Immutable state updates** — All store mutations create new objects via spread, never mutate in place
- **Optimistic UI** — State updates applied before async persistence; rollback on error
- **Snapshot-based undo/redo** — Extension store maintains `history[]` and `future[]` arrays of full extension snapshots
- **Dev/prod branching in repos** — `isDevMode()` check at repo level, not in stores or components
