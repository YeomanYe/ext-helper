import { Search, Settings, X, LayoutGrid, List } from "lucide-react"
import { cn } from "@/utils"
import type { FilterType, ViewMode } from "@/types"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

export function SearchBar({ value, onChange, placeholder = "Search extensions..." }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "h-11 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-10 text-sm",
          "placeholder:text-gray-400",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
          "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
        )}
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

interface QuickFiltersProps {
  activeFilter: FilterType
  onFilterChange: (filter: FilterType) => void
}

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "all", label: "All" },
  { value: "enabled", label: "Enabled" },
  { value: "disabled", label: "Disabled" }
]

export function QuickFilters({ activeFilter, onFilterChange }: QuickFiltersProps) {
  return (
    <div className="flex gap-1">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          onClick={() => onFilterChange(filter.value)}
          className={cn(
            "rounded-full px-3 py-1 text-xs font-medium transition-colors",
            activeFilter === filter.value
              ? "bg-primary text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
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
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <span className="text-white font-bold text-sm">E</span>
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          ExtHelper
        </h1>
      </div>
      <div className="flex items-center gap-1">
        {/* View Mode Toggle */}
        <div className="flex rounded-md border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onViewModeChange?.("compact")}
            className={cn(
              "flex items-center justify-center p-1.5 rounded-l-md",
              viewMode === "compact"
                ? "bg-primary text-white"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => onViewModeChange?.("card")}
            className={cn(
              "flex items-center justify-center p-1.5 rounded-r-md",
              viewMode === "card"
                ? "bg-primary text-white"
                : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={onSettingsClick}
          className="flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
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
    <footer className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-500 dark:border-gray-700 dark:bg-gray-800">
      <span>
        {enabledCount} of {totalCount} enabled
      </span>
    </footer>
  )
}
