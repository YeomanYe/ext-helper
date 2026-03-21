import * as React from "react"
import { Settings, X, LayoutGrid, List, ChevronDown } from "lucide-react"
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
  onSettingsClick?: () => void
  viewMode?: ViewMode
  onViewModeChange?: (mode: ViewMode) => void
}

export function Header({ onSettingsClick, viewMode = "compact", onViewModeChange }: HeaderProps) {
  return (
    <header className="flex items-center justify-between bg-punk-bg-alt px-3 py-2.5 border-b border-punk-border/30">
      <div className="flex items-center gap-2">
        <div className="relative">
          <div className="flex h-8 w-8 items-center justify-center border-2 border-punk-primary bg-punk-bg-alt">
            <span className="font-punk-heading text-[8px] text-punk-primary neon-text">E</span>
          </div>
          {/* Corner decorations */}
          <div className="absolute -top-0.5 -left-0.5 w-2 h-2 border-t border-l border-punk-neon-cyan" />
          <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 border-b border-r border-punk-neon-cyan" />
        </div>
        <h1 className="font-punk-heading text-[10px] text-punk-text-primary tracking-wide">
          EXTHELPER
        </h1>
      </div>
      <div className="flex items-center gap-1">
        {/* View Mode Toggle */}
        <div className="flex border border-punk-border/30">
          <button
            onClick={() => onViewModeChange?.("compact")}
            className={cn(
              "flex items-center justify-center p-1.5 transition-all duration-200",
              viewMode === "compact"
                ? "bg-punk-primary text-white shadow-neon-purple"
                : "text-punk-text-muted hover:text-punk-accent hover:bg-punk-bg-alt"
            )}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange?.("card")}
            className={cn(
              "flex items-center justify-center p-1.5 transition-all duration-200",
              viewMode === "card"
                ? "bg-punk-primary text-white shadow-neon-purple"
                : "text-punk-text-muted hover:text-punk-accent hover:bg-punk-bg-alt"
            )}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={onSettingsClick}
          className="flex h-8 w-8 items-center justify-center text-punk-text-muted hover:text-punk-accent hover:bg-punk-bg-alt transition-all duration-200 border border-transparent hover:border-punk-accent/30"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}

interface FooterProps {
  totalCount: number
  enabledCount: number
}

export function Footer({ totalCount, enabledCount }: FooterProps) {
  return (
    <footer className="flex items-center justify-between bg-punk-bg-alt px-3 py-2 border-t border-punk-border/30 font-punk-code text-[10px] text-punk-text-muted">
      <span className="flex items-center gap-1">
        <span className="text-punk-success">ON</span>
        <span>[{enabledCount}]</span>
        <span className="text-punk-text-muted">/</span>
        <span className="text-punk-text-secondary">OFF</span>
        <span>[{totalCount - enabledCount}]</span>
      </span>
      <span className="text-punk-accent">SYS::ACTIVE</span>
    </footer>
  )
}
