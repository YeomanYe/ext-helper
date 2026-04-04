import * as React from "react"
import { X, LayoutGrid, List, ChevronDown, FileText } from "lucide-react"
import { cn } from "@/utils"
import type { FilterType, ViewMode } from "@/types"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  activeFilter?: FilterType
  onFilterChange?: (filter: FilterType) => void
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "ALL" },
  { value: "enabled", label: "ON" },
  { value: "disabled", label: "OFF" }
]

export function SearchBar({ value, onChange, placeholder = "SEARCH_EXTENSIONS...", activeFilter = "all", onFilterChange }: SearchBarProps) {
  const [showDropdown, setShowDropdown] = React.useState(false)

  const currentFilter = FILTERS.find(f => f.value === activeFilter) || FILTERS[0]

  return (
    <div className="flex items-center gap-3">
      {/* Filter Select */}
      {onFilterChange && (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={cn(
              "flex items-center gap-2 px-3 h-11",
              "border border-punk-border/50 bg-punk-bg-alt",
              "font-punk-heading text-[9px] uppercase tracking-wide",
              "text-punk-text-primary",
              "hover:border-punk-primary hover:shadow-[0_0_10px_rgba(124,58,237,0.3)]",
              "transition-all duration-200"
            )}
          >
            <span>{currentFilter.label}</span>
            <ChevronDown className={cn("h-3 w-3 transition-transform", showDropdown && "rotate-180")} />
          </button>

          {showDropdown && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
              <div className="absolute top-full left-0 mt-1 z-50 w-full border border-punk-border bg-punk-bg-alt shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => {
                      onFilterChange(filter.value)
                      setShowDropdown(false)
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-left font-punk-heading text-[9px] uppercase tracking-wide",
                      "transition-all duration-150",
                      activeFilter === filter.value
                        ? "bg-punk-primary text-white"
                        : "text-punk-text-secondary hover:bg-punk-bg hover:text-punk-text-primary"
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
        <span className="absolute left-3 top-1/2 -translate-y-1/2 font-punk-body text-punk-accent text-lg">$</span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "punk-input h-11 w-full pl-9 pr-10 text-punk-text-primary",
            "font-punk-body text-lg"
          )}
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-punk-text-muted hover:text-punk-accent transition-colors"
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
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "punk-btn px-3 py-1.5 transition-all duration-200",
            activeFilter === filter.value
              ? "punk-btn-primary"
              : "bg-punk-bg-alt text-punk-text-secondary hover:text-punk-primary border border-punk-primary/30 hover:border-punk-primary"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}

interface HeaderProps {
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
}

export function Header({ viewMode = "compact", onViewModeChange }: HeaderProps) {
  return (
    <header className="relative flex items-center justify-between border-b-2 border-punk-primary bg-punk-bg px-4 py-3 hud-corner">
      {/* Decorative scanline */}
      <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
        <div className="w-full h-1 bg-punk-accent animate-scanline" />
      </div>

      {/* Logo and Title */}
      <div className="flex items-center gap-3 relative z-10">
        {/* Cyberpunk Logo */}
        <div className="relative">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-punk-neon-cyan bg-punk-bg-alt">
            <span className="font-punk-heading text-xs text-punk-neon-cyan animate-pulse-neon">E</span>
          </div>
          {/* Glow effect */}
          <div className="absolute inset-0 blur-md bg-punk-neon-cyan/30 -z-10" />
        </div>

        <div className="flex flex-col">
          <h1 className="font-punk-heading text-xs text-punk-neon-cyan">
            EXTHELPER
          </h1>
          <span className="font-punk-body text-punk-text-muted text-sm tracking-wider">
            EXTENSION_MGR_v2.0
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 relative z-10">
        {/* View Mode Toggle */}
        <div className="flex border border-punk-border/30 bg-punk-bg/50">
          <button
            onClick={() => onViewModeChange?.("compact")}
            className={cn(
              "flex items-center gap-1 px-2 py-1 transition-all duration-200",
              viewMode === "compact"
                ? "bg-punk-primary/30 text-punk-accent border border-punk-primary/50"
                : "text-punk-text-muted hover:text-punk-text-secondary border border-transparent"
            )}
            title="Grid view"
          >
            <LayoutGrid className="h-3 w-3" />
            <span className="text-[6px] font-punk-heading uppercase">GRID</span>
          </button>
          <button
            onClick={() => onViewModeChange?.("card")}
            className={cn(
              "flex items-center gap-1 px-2 py-1 transition-all duration-200",
              viewMode === "card"
                ? "bg-punk-primary/30 text-punk-accent border border-punk-primary/50"
                : "text-punk-text-muted hover:text-punk-text-secondary border border-transparent"
            )}
            title="Card view"
          >
            <List className="h-3 w-3" />
            <span className="text-[6px] font-punk-heading uppercase">CARD</span>
          </button>
          <button
            onClick={() => onViewModeChange?.("detail")}
            className={cn(
              "flex items-center gap-1 px-2 py-1 transition-all duration-200",
              viewMode === "detail"
                ? "bg-punk-primary/30 text-punk-accent border border-punk-primary/50"
                : "text-punk-text-muted hover:text-punk-text-secondary border border-transparent"
            )}
            title="Detail view"
          >
            <FileText className="h-3 w-3" />
            <span className="text-[6px] font-punk-heading uppercase">DETAIL</span>
          </button>
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
  const percentage = Math.round((enabledCount / totalCount) * 100)

  return (
    <footer className="relative flex items-center justify-between border-t-2 border-punk-primary bg-punk-bg-alt px-4 py-2 overflow-hidden">
      {/* Progress bar background */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-punk-bg w-full">
        <div
          className="h-full bg-punk-success transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Status text */}
      <div className="flex items-center gap-3">
        <span className="font-punk-body text-punk-text-muted text-sm">
          SYS_STATUS:
        </span>
        <span className="font-punk-body text-punk-success text-sm">
          {enabledCount}/{totalCount} ONLINE
        </span>
        <span className="text-punk-text-muted">|</span>
        <span className="font-punk-body text-punk-accent text-sm">
          {percentage}%_ACTIVE
        </span>
      </div>

      {/* Blinking indicator */}
      <div className="flex items-center gap-2">
        <div className="h-2 w-2 bg-punk-success animate-pulse shadow-neon-cyan rounded-full" />
        <span className="font-punk-body text-punk-success text-xs">LIVE</span>
      </div>
    </footer>
  )
}
