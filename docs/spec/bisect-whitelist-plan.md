# Bisect Whitelist Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a whitelist for bisect debugging so users can exclude specific extensions (password managers, IMEs, etc.) from being disabled during a bisect session, with a persisted global default and a per-session adjustment dialog on Start Bisect.

**Architecture:** Persist `bisectWhitelist: string[]` in `Preferences` (existing storage layer). Mirror in `useUIStore` so React components read reactively. `extensionStore.startBisect(whitelist)` becomes parameterized (default `[]`) so existing call sites and tests keep working. New `BisectWhitelistDialog` component (custom portal, matching `ConfirmDialog`) drives both flows: a "Start Bisect" mode (from the Actions menu) and an "Edit only" mode (new `Manage Bisect Whitelist` menu item). PopupPage owns the dialog state and is the single integration point.

**Tech Stack:** TypeScript, React, Zustand, Vitest, Testing Library, Tailwind (punk theme tokens), `createPortal` for modal.

**Spec:** `docs/spec/bisect-whitelist.md`

---

## File Map

- Modify: `src/types/index.ts` — extend `Preferences` and `UIStore` interfaces
- Modify: `src/services/preferencesRepo.ts` — add `bisectWhitelist` to `StoredPreferences` type
- Modify: `src/stores/uiStore.ts` — add `bisectWhitelist` state + `setBisectWhitelist` action + hydrate in `initializeUIStore`
- Modify: `src/stores/extensionStore.ts` — `startBisect` accepts optional `whitelist: string[]`, filters candidates
- Create: `src/components/popup/BisectWhitelistDialog.tsx` — new modal component
- Modify: `src/components/popup/ExtensionsActionsMenu.tsx` — add `onManageBisectWhitelist` prop + menu item
- Modify: `src/components/PopupPage.tsx` — own dialog mode state, wire callbacks
- Modify: `src/stores/__tests__/extensionStore.test.ts` — new tests for whitelist filtering
- Modify: `src/stores/__tests__/uiStore.test.ts` — new test for `setBisectWhitelist` + hydration
- Create: `src/components/popup/__tests__/BisectWhitelistDialog.test.tsx`
- Modify: `CHANGELOG.md` — `[Unreleased]` entry

---

## Task 1: Extend `Preferences` and storage types

Add the new field so the persistence layer can round-trip it. No behavior change yet.

**Files:**
- Modify: `src/types/index.ts:106-115`
- Modify: `src/services/preferencesRepo.ts:8-16`

- [ ] **Step 1: Extend `Preferences` interface**

In `src/types/index.ts`, append `bisectWhitelist?: string[]` to the `Preferences` interface:

```ts
export interface Preferences {
  theme: "light" | "dark" | "system"
  compactMode: boolean
  showDisabled: boolean
  sortBy: SortType
  viewMode: ViewMode
  aiSettings?: AiSettings
  recommendationApiBaseUrl?: string
  cloudRecommendationEnabled?: boolean
  bisectWhitelist?: string[]
}
```

- [ ] **Step 2: Extend `StoredPreferences` type**

In `src/services/preferencesRepo.ts`, add the field to `StoredPreferences`:

```ts
type StoredPreferences = Partial<{
  theme: Preferences["theme"]
  compactMode: boolean
  showDisabled: boolean
  viewMode: ViewMode
  aiSettings: AiSettings
  recommendationApiBaseUrl: string
  cloudRecommendationEnabled: boolean
  bisectWhitelist: string[]
}>
```

- [ ] **Step 3: Verify typecheck passes**

Run: `pnpm tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/services/preferencesRepo.ts
git commit -m "feat(types): add bisectWhitelist to Preferences"
```

---

## Task 2: Expose `bisectWhitelist` in `useUIStore`

Make the whitelist reactively readable in React + provide a setter that persists.

**Files:**
- Modify: `src/types/index.ts:259-269` (UIStore interface)
- Modify: `src/stores/uiStore.ts`
- Test: `src/stores/__tests__/uiStore.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/stores/__tests__/uiStore.test.ts` (inside an appropriate `describe` block, or a new one):

```ts
describe("setBisectWhitelist", () => {
  it("normal: updates state and persists to preferencesRepo", async () => {
    const saveSpy = vi.spyOn(preferencesRepo, "save").mockResolvedValue()

    await useUIStore.getState().setBisectWhitelist(["ext-a", "ext-b"])

    expect(useUIStore.getState().bisectWhitelist).toEqual(["ext-a", "ext-b"])
    expect(saveSpy).toHaveBeenCalledWith({ bisectWhitelist: ["ext-a", "ext-b"] })
  })

  it("normal: initializeUIStore hydrates bisectWhitelist from prefs", async () => {
    vi.spyOn(preferencesRepo, "fetch").mockResolvedValue({
      bisectWhitelist: ["ext-c"],
    })

    await initializeUIStore()

    expect(useUIStore.getState().bisectWhitelist).toEqual(["ext-c"])
  })
})
```

Make sure imports include `preferencesRepo` and `initializeUIStore` — check the top of the file and add as needed.

- [ ] **Step 2: Run the test and watch it fail**

Run: `pnpm vitest run src/stores/__tests__/uiStore.test.ts`
Expected: FAIL — `setBisectWhitelist` is not a function; `bisectWhitelist` is undefined.

- [ ] **Step 3: Extend `UIStore` interface**

In `src/types/index.ts`, update `UIStore`:

```ts
export interface UIStore {
  theme: "light" | "dark" | "system"
  compactMode: boolean
  showDisabled: boolean
  viewMode: ViewMode
  bisectWhitelist: string[]
  lastUpdate: number
  setTheme: (theme: "light" | "dark" | "system") => void
  toggleCompactMode: () => void
  toggleShowDisabled: () => void
  setViewMode: (mode: ViewMode) => void
  setBisectWhitelist: (ids: string[]) => Promise<void>
}
```

- [ ] **Step 4: Implement in `useUIStore`**

In `src/stores/uiStore.ts`:

- Add `bisectWhitelist: []` to initial state.
- Add `setBisectWhitelist` action after `setViewMode`:

```ts
setBisectWhitelist: async (ids: string[]) => {
  set({ bisectWhitelist: ids, lastUpdate: Date.now() })
  try {
    await preferencesRepo.save({ bisectWhitelist: ids })
  } catch (error) {
    logger.error("Failed to save bisect whitelist preference:", error)
  }
},
```

- In `initializeUIStore`, after the existing `if (prefs.viewMode)` block:

```ts
if (Array.isArray(prefs.bisectWhitelist)) {
  nextState.bisectWhitelist = prefs.bisectWhitelist
}
```

- Update the `PreferenceUpdates` type alias near the top of `uiStore.ts`:

```ts
type PreferenceUpdates = Partial<
  Pick<Preferences, "theme" | "compactMode" | "showDisabled" | "viewMode" | "bisectWhitelist">
>
```

- [ ] **Step 5: Run the test and verify it passes**

Run: `pnpm vitest run src/stores/__tests__/uiStore.test.ts`
Expected: PASS (including pre-existing tests).

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/stores/uiStore.ts src/stores/__tests__/uiStore.test.ts
git commit -m "feat(uiStore): expose bisectWhitelist state + setter"
```

---

## Task 3: `startBisect` accepts and applies whitelist

Filter candidate IDs by the whitelist passed in, with default `[]` so existing call sites/tests still pass.

**Files:**
- Modify: `src/types/index.ts:224` (ExtensionStore.startBisect signature)
- Modify: `src/stores/extensionStore.ts:239-292`
- Test: `src/stores/__tests__/extensionStore.test.ts:506+`

- [ ] **Step 1: Write the failing tests**

Add to the `describe("startBisect", ...)` block in `src/stores/__tests__/extensionStore.test.ts`. The existing `createStore()` helper sets up enabled extensions `a` and `b` by default; you may need to add more for these tests — search the file for `createStore` to see how to pass custom extensions:

```ts
it("normal: excludes whitelisted ids from candidates", async () => {
  const exts = [
    makeExtension({ id: "a", enabled: true }),
    makeExtension({ id: "b", enabled: true }),
    makeExtension({ id: "c", enabled: true }),
  ]
  const store = await createStore(exts)
  await store.getState().startBisect(["b"])

  const session = store.getState().bisectSession
  expect(session.allCandidateIds.sort()).toEqual(["a", "c"])
})

it("edge: refuses to start when whitelist leaves fewer than 2 candidates", async () => {
  const exts = [
    makeExtension({ id: "a", enabled: true }),
    makeExtension({ id: "b", enabled: true }),
  ]
  const store = await createStore(exts)
  await store.getState().startBisect(["b"])

  expect(store.getState().bisectSession.active).toBe(false)
  expect(store.getState().error).toBe(
    "Need at least two non-whitelisted enabled extensions to start bisect"
  )
})

it("normal: whitelisted extensions keep their baseline enabled state after start", async () => {
  const exts = [
    makeExtension({ id: "a", enabled: true }),
    makeExtension({ id: "b", enabled: true }),
    makeExtension({ id: "c", enabled: true }),
  ]
  const store = await createStore(exts)
  await store.getState().startBisect(["c"])

  const c = store.getState().extensions.find((e) => e.id === "c")
  expect(c?.enabled).toBe(true)
})

it("edge: whitelisted but currently disabled extension stays disabled", async () => {
  const exts = [
    makeExtension({ id: "a", enabled: true }),
    makeExtension({ id: "b", enabled: true }),
    makeExtension({ id: "c", enabled: false }),
  ]
  const store = await createStore(exts)
  await store.getState().startBisect(["c"])

  const c = store.getState().extensions.find((e) => e.id === "c")
  expect(c?.enabled).toBe(false)
})

it("edge: unknown ids in whitelist are ignored gracefully", async () => {
  const exts = [
    makeExtension({ id: "a", enabled: true }),
    makeExtension({ id: "b", enabled: true }),
  ]
  const store = await createStore(exts)
  await store.getState().startBisect(["does-not-exist"])

  expect(store.getState().bisectSession.active).toBe(true)
  expect(store.getState().bisectSession.allCandidateIds.sort()).toEqual(["a", "b"])
})
```

- [ ] **Step 2: Run tests and watch them fail**

Run: `pnpm vitest run src/stores/__tests__/extensionStore.test.ts -t startBisect`
Expected: 5 new tests fail (whitelist arg is ignored; pre-existing tests still pass).

- [ ] **Step 3: Update `ExtensionStore` type**

In `src/types/index.ts:224`:

```ts
startBisect: (whitelist?: string[]) => Promise<void>
```

- [ ] **Step 4: Implement whitelist filtering in `startBisect`**

In `src/stores/extensionStore.ts`, change the `startBisect` signature and candidate collection:

```ts
startBisect: async (whitelist: string[] = []) => {
  const state = get()
  if (state.bisectSession.active) return

  const baselineExtensions = cloneExtensions(state.extensions)
  const whitelistSet = new Set(whitelist)
  const candidateIds = baselineExtensions
    .filter((extension) => extension.enabled && !whitelistSet.has(extension.id))
    .map((extension) => extension.id)

  if (candidateIds.length < 2) {
    set({
      error:
        whitelist.length > 0
          ? "Need at least two non-whitelisted enabled extensions to start bisect"
          : "Need at least two enabled extensions to start bisect",
    })
    return
  }

  // ...rest of the function unchanged
```

Leave the rest of the function body (`splitCandidateIds`, snapshot construction, `runOptimisticMutation`) untouched — whitelisted IDs naturally end up outside `allCandidateIds`, so `buildBisectExtensions` will keep them in their baseline state.

- [ ] **Step 5: Run startBisect tests**

Run: `pnpm vitest run src/stores/__tests__/extensionStore.test.ts -t startBisect`
Expected: ALL pass (including original 6 + 5 new).

- [ ] **Step 6: Run the full test suite to catch regressions**

Run: `pnpm vitest run`
Expected: ALL pass.

- [ ] **Step 7: Commit**

```bash
git add src/types/index.ts src/stores/extensionStore.ts src/stores/__tests__/extensionStore.test.ts
git commit -m "feat(bisect): startBisect filters candidates by whitelist"
```

---

## Task 4: `BisectWhitelistDialog` component

Modal that drives both Start Bisect confirmation and standalone whitelist editing.

**Files:**
- Create: `src/components/popup/BisectWhitelistDialog.tsx`
- Test: `src/components/popup/__tests__/BisectWhitelistDialog.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `src/components/popup/__tests__/BisectWhitelistDialog.test.tsx`:

```tsx
import { describe, it, expect, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { BisectWhitelistDialog } from "@/components/popup/BisectWhitelistDialog"
import type { Extension } from "@/types"

function makeExt(over: Partial<Extension>): Extension {
  return {
    id: "ext-1",
    name: "Ext 1",
    enabled: true,
    mayDisable: true,
    icon: "",
    description: "",
    version: "1.0.0",
    installType: "normal",
    type: "extension",
    ...over,
  } as Extension
}

describe("BisectWhitelistDialog", () => {
  const extensions = [
    makeExt({ id: "a", name: "Alpha" }),
    makeExt({ id: "b", name: "Beta" }),
    makeExt({ id: "c", name: "Gamma", mayDisable: false }),
  ]

  it("normal: edit mode confirms with the current selection", () => {
    const onConfirm = vi.fn()
    render(
      <BisectWhitelistDialog
        open
        mode="edit"
        extensions={extensions}
        initialWhitelist={["a"]}
        onConfirm={onConfirm}
        onCancel={() => {}}
      />
    )

    // toggle b on
    fireEvent.click(screen.getByLabelText("Beta"))
    fireEvent.click(screen.getByText("Save"))

    expect(onConfirm).toHaveBeenCalledWith(["a", "b"])
  })

  it("edge: hides extensions with mayDisable === false", () => {
    render(
      <BisectWhitelistDialog
        open
        mode="edit"
        extensions={extensions}
        initialWhitelist={[]}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    expect(screen.queryByLabelText("Gamma")).toBeNull()
  })

  it("edge: start-bisect mode disables Start when fewer than 2 candidates remain", () => {
    render(
      <BisectWhitelistDialog
        open
        mode="start-bisect"
        extensions={extensions}
        initialWhitelist={["a"]}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    const startBtn = screen.getByRole("button", { name: /start bisect/i })
    expect(startBtn).toBeDisabled()
    expect(
      screen.getByText(/Need at least 2 candidates/i)
    ).toBeInTheDocument()
  })

  it("normal: Cancel calls onCancel without onConfirm", () => {
    const onConfirm = vi.fn()
    const onCancel = vi.fn()
    render(
      <BisectWhitelistDialog
        open
        mode="edit"
        extensions={extensions}
        initialWhitelist={[]}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    fireEvent.click(screen.getByText("Cancel"))
    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it("edge: returns null when open is false", () => {
    const { container } = render(
      <BisectWhitelistDialog
        open={false}
        mode="edit"
        extensions={extensions}
        initialWhitelist={[]}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    )
    expect(container).toBeEmptyDOMElement()
  })
})
```

- [ ] **Step 2: Run the test and watch it fail**

Run: `pnpm vitest run src/components/popup/__tests__/BisectWhitelistDialog.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `src/components/popup/BisectWhitelistDialog.tsx`:

```tsx
import * as React from "react"
import { createPortal } from "react-dom"
import type { Extension } from "@/types"
import { cn } from "@/utils"

export type BisectWhitelistDialogMode = "edit" | "start-bisect"

interface BisectWhitelistDialogProps {
  open: boolean
  mode: BisectWhitelistDialogMode
  extensions: Extension[]
  initialWhitelist: string[]
  onConfirm: (ids: string[]) => void
  onCancel: () => void
}

export function BisectWhitelistDialog({
  open,
  mode,
  extensions,
  initialWhitelist,
  onConfirm,
  onCancel,
}: BisectWhitelistDialogProps) {
  const [selected, setSelected] = React.useState<string[]>(initialWhitelist)

  React.useEffect(() => {
    if (open) setSelected(initialWhitelist)
  }, [open, initialWhitelist])

  if (!open) return null
  if (typeof document === "undefined") return null

  // Hide extensions that can't be toggled anyway
  const visible = extensions.filter((e) => e.mayDisable !== false)

  const selectedSet = new Set(selected)
  const candidateCount = visible.filter((e) => e.enabled && !selectedSet.has(e.id)).length
  const tooFewCandidates = mode === "start-bisect" && candidateCount < 2

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const confirmLabel = mode === "start-bisect" ? "Start Bisect" : "Save"
  const title =
    mode === "start-bisect" ? "Start Bisect — Whitelist" : "Bisect Whitelist"

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-punk-bg/70 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="w-96 max-h-[80vh] flex flex-col border border-punk-primary bg-punk-surface-raised shadow-punk-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-3 border-b border-punk-primary">
          <h3 className="flex-1 font-punk-heading text-[10px] text-punk-text-primary uppercase tracking-wider">
            {title}
          </h3>
        </div>

        <p className="px-4 py-2 font-punk-body text-[10px] text-punk-text-secondary leading-relaxed">
          Whitelisted extensions stay in their current state and are excluded from bisect.
        </p>

        <div className="flex-1 overflow-y-auto px-2 py-1">
          {visible.length === 0 && (
            <p className="px-2 py-3 font-punk-body text-[10px] text-punk-text-muted">
              No toggleable extensions found.
            </p>
          )}
          {visible.map((ext) => {
            const checked = selectedSet.has(ext.id)
            return (
              <label
                key={ext.id}
                className="flex items-center gap-2 px-2 py-1.5 hover:bg-punk-surface-soft cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(ext.id)}
                  aria-label={ext.name}
                />
                <span className="flex-1 font-punk-body text-[11px] text-punk-text-primary truncate">
                  {ext.name}
                </span>
                {!ext.enabled && (
                  <span className="font-punk-code text-[9px] uppercase text-punk-text-muted">
                    OFF
                  </span>
                )}
              </label>
            )
          })}
        </div>

        {tooFewCandidates && (
          <p className="px-4 py-2 font-punk-body text-[10px] text-punk-warning border-t border-punk-warning/40">
            Need at least 2 candidates; remove items from the whitelist.
          </p>
        )}

        <div className="flex justify-end gap-2 px-4 py-3 border-t border-punk-border/30">
          <button
            onClick={onCancel}
            className="px-4 py-2 font-punk-heading text-[13px] text-punk-text-muted uppercase tracking-wider hover:text-punk-text-primary"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected)}
            disabled={tooFewCandidates}
            className={cn(
              "px-4 py-2 font-punk-heading text-[13px] uppercase tracking-wider text-white bg-punk-primary hover:bg-punk-primary/90 transition-all",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
```

- [ ] **Step 4: Add to popup barrel export**

In `src/components/popup/index.ts`, add:

```ts
export { BisectWhitelistDialog } from "./BisectWhitelistDialog"
```

- [ ] **Step 5: Run the dialog tests**

Run: `pnpm vitest run src/components/popup/__tests__/BisectWhitelistDialog.test.tsx`
Expected: ALL 5 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/popup/BisectWhitelistDialog.tsx src/components/popup/index.ts src/components/popup/__tests__/BisectWhitelistDialog.test.tsx
git commit -m "feat(bisect): add BisectWhitelistDialog modal"
```

---

## Task 5: Update `ExtensionsActionsMenu` menu items

Defer Start Bisect via callback (parent now opens dialog instead of starting immediately); add `Manage Bisect Whitelist` item.

**Files:**
- Modify: `src/components/popup/ExtensionsActionsMenu.tsx`

- [ ] **Step 1: Add new prop and menu item**

In `src/components/popup/ExtensionsActionsMenu.tsx`:

- Add `onManageBisectWhitelist: () => void` to `ExtensionsActionsMenuProps`.
- Destructure it in the function signature.
- Insert a new menu item right above the existing `Enable All` button (around line 110):

```tsx
{!isBisectActive && (
  <button
    onClick={() => {
      onManageBisectWhitelist()
      setOpen(false)
    }}
    className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-surface-soft hover:text-punk-text-primary"
  >
    Manage Bisect Whitelist
  </button>
)}
```

**Note:** the `Start Bisect` button is unchanged in this file. The semantics shift (now opens dialog) live in PopupPage's handler, not here.

- [ ] **Step 2: Typecheck**

Run: `pnpm tsc --noEmit`
Expected: Errors at `PopupPage.tsx` (missing prop) — that's expected, will fix in Task 6.

- [ ] **Step 3: Commit (defer until PopupPage compiles)**

Hold the commit; finish Task 6 first and combine. _Skip this step_.

---

## Task 6: Wire dialog into `PopupPage`

PopupPage owns the dialog mode state and orchestrates the new flows.

**Files:**
- Modify: `src/components/PopupPage.tsx`

- [ ] **Step 1: Add dialog state and imports**

Near the top of `PopupPage.tsx`, add to existing imports:

```ts
import { BisectWhitelistDialog } from "@/components/popup"
import type { BisectWhitelistDialogMode } from "@/components/popup/BisectWhitelistDialog"
import { useUIStore } from "@/stores/uiStore"
```

(Check whether `useUIStore` is already imported; if so, don't duplicate.)

Inside the component body, before the `return`:

```ts
const bisectWhitelist = useUIStore((s) => s.bisectWhitelist)
const setBisectWhitelist = useUIStore((s) => s.setBisectWhitelist)
const [bisectDialogMode, setBisectDialogMode] = React.useState<BisectWhitelistDialogMode | null>(null)

const handleStartBisectClicked = () => setBisectDialogMode("start-bisect")
const handleManageWhitelistClicked = () => setBisectDialogMode("edit")
const handleDialogCancel = () => setBisectDialogMode(null)
const handleDialogConfirm = async (ids: string[]) => {
  await setBisectWhitelist(ids)
  const mode = bisectDialogMode
  setBisectDialogMode(null)
  if (mode === "start-bisect") {
    await startBisect(ids)
  }
}
```

- [ ] **Step 2: Replace the `onStartBisect` wiring**

In the `<ExtensionsActionsMenu>` JSX, change:

```tsx
onStartBisect={() => void startBisect()}
```

to:

```tsx
onStartBisect={handleStartBisectClicked}
onManageBisectWhitelist={handleManageWhitelistClicked}
```

- [ ] **Step 3: Render the dialog**

Add at the end of the main wrapper JSX, just before the closing tag (sibling of `ImportExportDialog`):

```tsx
<BisectWhitelistDialog
  open={bisectDialogMode !== null}
  mode={bisectDialogMode ?? "edit"}
  extensions={extensions}
  initialWhitelist={bisectWhitelist}
  onConfirm={(ids) => void handleDialogConfirm(ids)}
  onCancel={handleDialogCancel}
/>
```

Verify that `extensions` is already in scope in `PopupPage.tsx` — it's used elsewhere in the component (search for `useExtensionStore`). If not directly destructured, add it.

- [ ] **Step 4: Typecheck + run all tests**

Run: `pnpm tsc --noEmit && pnpm vitest run`
Expected: typecheck clean, all tests pass.

- [ ] **Step 5: Run lint**

Run: `pnpm lint`
Expected: 0 errors, 0 warnings (this project enforces zero warnings per recent commits).

- [ ] **Step 6: Commit (Tasks 5 + 6 together)**

```bash
git add src/components/popup/ExtensionsActionsMenu.tsx src/components/PopupPage.tsx
git commit -m "feat(bisect): wire whitelist dialog into Start Bisect + actions menu"
```

---

## Task 7: Manual visual + behavioral verification

Spec marks `needs_visual_check: true`. Do this in the dev preview before declaring done.

- [ ] **Step 1: Launch dev preview**

Run: `pnpm dev:web`
Open the URL it prints.

- [ ] **Step 2: Verify the three flows**

1. Click ACTIONS → `Manage Bisect Whitelist` → dialog opens in edit mode → check 1-2 extensions → Save → dialog closes.
2. Reload the page → click ACTIONS → `Manage Bisect Whitelist` again → previously checked items stay checked (persistence works).
3. Click ACTIONS → `Start Bisect` → dialog opens in start-bisect mode → confirm → bisect banner appears, whitelisted extensions are untouched.
4. Whitelist enough extensions to leave < 2 candidates → `Start Bisect` button disabled + warning shown.

- [ ] **Step 3: Verify in both themes**

Toggle theme via Header settings to dark + light. Confirm dialog readability in both.

- [ ] **Step 4: Capture artifacts (optional, for spec verification)**

Screenshots of: dialog edit mode, dialog start-bisect mode, dialog with "too few candidates" warning.

---

## Task 8: CHANGELOG entry

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Locate the `[Unreleased]` section**

Open `CHANGELOG.md`. There's a `[2.1.0] Unreleased` section per the recent commit `291607e`.

- [ ] **Step 2: Add entry under `Added`**

Add a bullet:

```md
- 二分调试白名单：在 ACTIONS 菜单加 `Manage Bisect Whitelist`，Start Bisect 时弹出确认对话框，可临时勾选/取消并持久化为偏好；白名单扩展在整轮二分保持基线状态。
```

If there's no `### Added` heading under Unreleased yet, add one.

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs(changelog): add bisect whitelist entry"
```

---

## Done checklist

- [ ] All tests pass: `pnpm vitest run`
- [ ] Typecheck clean: `pnpm tsc --noEmit`
- [ ] Lint clean: `pnpm lint`
- [ ] Manual visual check completed (Task 7)
- [ ] CHANGELOG updated
- [ ] All commits pushed to the working branch
