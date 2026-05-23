import * as React from "react"
import {
  X,
  LayoutGrid,
  List,
  ChevronDown,
  FileText,
  Settings,
  Upload,
  Download,
  Moon,
  Sun,
  Monitor,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/utils"
import { isDevMode } from "@/services/mockData"
import { browserAdapter } from "@/services/browser/adapter"
import { useUIStore } from "@/stores/uiStore"
import type { FilterType, Preferences, ViewMode } from "@/types"

function useExtensionVersion(): string {
  const [version, setVersion] = React.useState("1.0.0")
  React.useEffect(() => {
    if (!isDevMode()) {
      const v = browserAdapter.getManifestVersion()
      if (v) setVersion(v)
    }
  }, [])
  return version
}

export const BASE_FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "enabled", label: "ON" },
  { value: "disabled", label: "OFF" },
]

export const MAIN_FILTERS: { value: FilterType; label: string }[] = [
  ...BASE_FILTERS,
  { value: "in-group", label: "IN_GRP" },
  { value: "not-in-group", label: "NO_GRP" },
]

export const GROUP_PANEL_FILTERS: { value: FilterType; label: string }[] = [
  ...BASE_FILTERS,
  { value: "in-group", label: "IN_CUR" },
  { value: "not-in-group", label: "NOT_CUR" },
  { value: "in-any-group", label: "ANY_GRP" },
  { value: "no-any-group", label: "NO_GRP" },
]

export const ACTION_FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "in-rule", label: "SELECTED" },
  { value: "no-rule", label: "UNSELECT" },
]

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  activeFilter?: FilterType
  onFilterChange?: (filter: FilterType) => void
  filters?: { value: FilterType; label: string }[]
}

export function SearchBar({
  value,
  onChange,
  placeholder = "SEARCH_EXTENSIONS...",
  activeFilter = "all",
  onFilterChange,
  filters = BASE_FILTERS,
}: SearchBarProps) {
  const [showDropdown, setShowDropdown] = React.useState(false)
  const [dropUp, setDropUp] = React.useState(false)
  const buttonRef = React.useRef<HTMLButtonElement>(null)

  const handleToggle = () => {
    if (!showDropdown && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropUp(window.innerHeight - rect.bottom < filters.length * 36 + 8)
    }
    setShowDropdown((v) => !v)
  }

  return (
    <div className="flex items-center gap-3">
      {/* Filter Select */}
      {onFilterChange && (
        <div className="relative">
          <button
            ref={buttonRef}
            onClick={handleToggle}
            className={cn(
              "flex items-center gap-2 px-3 h-11",
              "border border-punk-border/50 bg-punk-surface-raised",
              "font-punk-heading text-[13px] uppercase tracking-wider",
              "text-punk-text-primary",
              "hover:border-punk-primary hover:shadow-punk-hard",
              "transition-all duration-200"
            )}
          >
            {/* Grid-stack: all labels occupy same cell, width = widest rendered label */}
            <span className="inline-grid">
              {filters.map((f) => (
                <span
                  key={f.value}
                  className={cn(
                    "col-start-1 row-start-1",
                    f.value !== activeFilter && "invisible select-none"
                  )}
                  aria-hidden={f.value !== activeFilter ? "true" : undefined}
                >
                  {f.label}
                </span>
              ))}
            </span>
            <ChevronDown
              className={cn("h-3 w-3 transition-transform", showDropdown && "rotate-180")}
            />
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div
                className={cn(
                  "absolute left-0 z-50 min-w-full border border-punk-border bg-punk-surface-raised shadow-punk-panel",
                  dropUp ? "bottom-full mb-1" : "top-full mt-1"
                )}
              >
                {filters.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      onFilterChange(filter.value)
                      setShowDropdown(false)
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left font-punk-heading text-[13px] uppercase tracking-wider",
                      "transition-all duration-150",
                      activeFilter === filter.value
                        ? "bg-punk-primary/12 text-punk-primary"
                        : "text-punk-text-secondary hover:bg-punk-surface-soft hover:text-punk-text-primary"
                    )}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Search Input */}
      <div className="relative flex-1">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-punk-body text-punk-accent text-lg">
          $
        </span>
        <input
          id="extension-search"
          name="extension-search"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "punk-input h-11 w-full pl-9 pr-10 text-punk-text-primary",
            "font-punk-body text-sm placeholder:text-punk-text-muted"
          )}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-punk-text-muted hover:text-punk-accent transition-colors"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

interface QuickFiltersProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

export function QuickFilters({ activeFilter, onFilterChange }: QuickFiltersProps) {
  return (
    <div className="flex gap-1">
      {MAIN_FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "punk-btn px-3 py-1.5 transition-all duration-200",
            activeFilter === filter.value
              ? "punk-btn-primary"
              : "bg-punk-surface-raised text-punk-text-secondary hover:text-punk-primary border border-punk-primary/30 hover:border-punk-primary"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

const VIEW_MODES: { mode: ViewMode; icon: LucideIcon; label: string }[] = [
  { mode: "compact", icon: LayoutGrid, label: "GRID" },
  { mode: "card", icon: List, label: "CARD" },
  { mode: "detail", icon: FileText, label: "DETAIL" },
]

const THEME_OPTIONS: {
  theme: Preferences["theme"]
  icon: LucideIcon
  label: string
  ariaLabel: string
}[] = [
  { theme: "dark", icon: Moon, label: "DARK", ariaLabel: "Use dark theme" },
  { theme: "light", icon: Sun, label: "LIGHT", ariaLabel: "Use light theme" },
  { theme: "system", icon: Monitor, label: "SYS", ariaLabel: "Follow system theme" },
]

function ViewModeToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
}) {
  return (
    <div
      className="flex border border-punk-border/30 bg-punk-surface-inset/70"
      role="group"
      aria-label="View mode"
    >
      {VIEW_MODES.map(({ mode, icon: Icon, label }) => (
        <button
          key={mode}
          onClick={() => onViewModeChange?.(mode)}
          aria-label={`${label.charAt(0) + label.slice(1).toLowerCase()} view`}
          aria-pressed={viewMode === mode}
          title={`${label.charAt(0) + label.slice(1).toLowerCase()} view`}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1.5 transition-all duration-200",
            viewMode === mode
              ? "bg-punk-primary/10 text-punk-accent border border-punk-primary/60"
              : "text-punk-text-muted hover:text-punk-text-secondary border border-transparent"
          )}
        >
          <Icon className="h-3 w-3" />
          <span className="text-[10px] font-punk-heading uppercase">{label}</span>
        </button>
      ))}
    </div>
  )
}

interface HeaderProps {
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
  onOpenImportExport?: (mode: "import" | "export") => void
}

export function Header({
  viewMode = "compact",
  onViewModeChange,
  onOpenImportExport,
}: HeaderProps) {
  const version = useExtensionVersion()
  const [showSettingsMenu, setShowSettingsMenu] = React.useState(false)
  const theme = useUIStore((state) => state.theme)
  const setTheme = useUIStore((state) => state.setTheme)
  return (
    <header className="relative flex items-center justify-between border-b-2 border-punk-primary bg-punk-surface-raised px-4 py-3 shadow-punk-hard hud-corner">
      {/* Decorative scanline */}
      <div className="absolute inset-0 overflow-hidden opacity-10 pointer-events-none">
        <div className="w-full h-1 bg-punk-accent animate-scanline" />
      </div>

      {/* Logo and Title */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Extension Icon */}
        <div className="relative">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background */}
            <rect width="40" height="40" fill="var(--punk-bg-alt)" />
            {/* Border */}
            <rect
              x="1.5"
              y="1.5"
              width="37"
              height="37"
              stroke="var(--punk-neon-cyan)"
              strokeWidth="2"
              fill="none"
            />
            {/* E letter with pulse animation */}
            <text
              x="20"
              y="20"
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--punk-neon-cyan)"
              fontSize="22"
              fontWeight="bold"
              fontFamily="monospace"
              className="animate-pulse-neon"
            >
              E
            </text>
          </svg>
          {/* Glow effect */}
          <div className="absolute inset-0 blur-md bg-punk-neon-cyan/30 -z-10" />
        </div>

        <div className="flex flex-col">
          <h1 className="font-punk-heading text-xs text-punk-neon-cyan">EXT HELPER</h1>
          <span className="font-punk-body text-punk-text-muted text-sm tracking-wider">
            EXTENSION_MGR_v{version}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 relative z-10">
        <ViewModeToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSettingsMenu((open) => !open)}
            aria-label="Open settings menu"
            aria-expanded={showSettingsMenu}
            title="Settings"
            className={cn(
              "flex h-8 w-8 items-center justify-center border border-punk-border/30 bg-punk-surface-inset/70",
              "text-punk-text-muted transition-all duration-200 hover:border-punk-accent hover:text-punk-accent",
              showSettingsMenu && "border-punk-accent text-punk-accent"
            )}
          >
            <Settings className="h-4 w-4" />
          </button>

          {showSettingsMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSettingsMenu(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-60 border border-punk-border bg-punk-surface-raised shadow-punk-panel">
                <div className="border-b border-punk-border/40 px-3 py-2">
                  <div className="mb-2 font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-muted">
                    THEME
                  </div>
                  <div className="grid grid-cols-3 border border-punk-border/60 bg-punk-surface-inset/70">
                    {THEME_OPTIONS.map(({ theme: optionTheme, icon: Icon, label, ariaLabel }) => (
                      <button
                        key={optionTheme}
                        type="button"
                        onClick={() => setTheme(optionTheme)}
                        aria-label={ariaLabel}
                        aria-pressed={theme === optionTheme}
                        title={ariaLabel}
                        className={cn(
                          "flex h-9 min-w-0 items-center justify-center gap-1 px-2 transition-all duration-200",
                          "border border-transparent font-punk-heading text-[10px] uppercase tracking-wider",
                          theme === optionTheme
                            ? "border-punk-primary/50 bg-punk-primary/10 text-punk-primary"
                            : "text-punk-text-muted hover:border-punk-accent/50 hover:text-punk-text-primary"
                        )}
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0" />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onOpenImportExport?.("import")
                    setShowSettingsMenu(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-heading text-[13px] uppercase tracking-wider text-punk-text-secondary transition-all duration-150 hover:bg-punk-surface-soft hover:text-punk-text-primary"
                >
                  <Upload className="h-3.5 w-3.5" />
                  IMPORT
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenImportExport?.("export")
                    setShowSettingsMenu(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left font-punk-heading text-[13px] uppercase tracking-wider text-punk-text-secondary transition-all duration-150 hover:bg-punk-surface-soft hover:text-punk-text-primary"
                >
                  <Download className="h-3.5 w-3.5" />
                  EXPORT
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

interface FooterProps {
  totalCount: number
  enabledCount: number
}

export function Footer({ totalCount, enabledCount }: FooterProps) {
  const percentage = totalCount > 0 ? Math.round((enabledCount / totalCount) * 100) : 0

  return (
    <footer className="relative flex items-center justify-between border-t-2 border-punk-primary bg-punk-surface-raised px-4 py-2 overflow-hidden shadow-punk-hard">
      {/* Progress bar background */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-punk-surface-inset w-full">
        <div
          className="h-full bg-punk-success transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Status text */}
      <div className="flex items-center gap-3">
        <span className="font-punk-body text-punk-text-muted text-sm">SYS_STATUS:</span>
        <span className="font-punk-body text-punk-success text-sm">
          {enabledCount}/{totalCount} ONLINE
        </span>
        <span className="text-punk-text-muted">|</span>
        <span className="font-punk-body text-punk-accent text-sm">{percentage}%_ACTIVE</span>
      </div>

      {/* Blinking indicator */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 bg-punk-success animate-pulse shadow-neon-cyan rounded-full" />
        <span className="font-punk-body text-punk-success text-xs">LIVE</span>
      </div>
    </footer>
  )
}
