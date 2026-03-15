import * as React from "react"
import { Settings, Trash2, MoreVertical, Package } from "lucide-react"
import { Switch } from "@/components/common"
import { cn } from "@/utils"
import type { Extension } from "@/types"

type ViewMode = "card" | "compact"

interface ExtensionCardProps {
  extension: Extension
  onToggle: () => void
  onOpenOptions?: () => void
  onRemove?: () => void
  viewMode?: ViewMode
  className?: string
}

export function ExtensionCard({
  extension,
  onToggle,
  onOpenOptions,
  onRemove,
  viewMode = "card",
  className
}: ExtensionCardProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    setShowMenu(true)
  }

  // Compact mode - only show icon and name
  if (viewMode === "compact") {
    return (
      <div
        className={cn(
          "group relative flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2",
          "hover:border-gray-300 hover:shadow-sm",
          "dark:border-gray-700 dark:bg-gray-800",
          !extension.enabled && "opacity-60",
          className
        )}
        onContextMenu={handleContextMenu}
      >
        {/* Extension Icon */}
        <div className="flex-shrink-0">
          {extension.iconUrl ? (
            <img
              src={extension.iconUrl}
              alt={extension.name}
              className="h-8 w-8 rounded object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
              <Package className="h-4 w-4 text-gray-400" />
            </div>
          )}
        </div>

        {/* Extension Name */}
        <div className="flex-1 min-w-0">
          <h3 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
            {extension.name}
          </h3>
        </div>

        {/* Toggle */}
        <Switch checked={extension.enabled} onCheckedChange={onToggle} />
      </div>
    )
  }

  // Card mode - full info
  return (
    <div
      className={cn(
        "group relative flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3",
        "hover:border-gray-300 hover:shadow-sm",
        "dark:border-gray-700 dark:bg-gray-800",
        !extension.enabled && "opacity-60",
        className
      )}
      onContextMenu={handleContextMenu}
    >
      {/* Extension Icon */}
      <div className="flex-shrink-0">
        {extension.iconUrl ? (
          <img
            src={extension.iconUrl}
            alt={extension.name}
            className="h-12 w-12 rounded-lg object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
            <Package className="h-6 w-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Extension Info */}
      <div className="flex-1 min-w-0">
        <h3 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {extension.name}
        </h3>
        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
          {extension.description || `Version ${extension.version}`}
        </p>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-gray-400 dark:text-gray-500">
            v{extension.version}
          </span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium",
              extension.enabled
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            )}
          >
            {extension.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Switch checked={extension.enabled} onCheckedChange={onToggle} />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {extension.optionsUrl && (
                <button
                  onClick={() => {
                    onOpenOptions?.()
                    setShowMenu(false)
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Settings className="h-4 w-4" />
                  Open Settings
                </button>
              )}
              <button
                onClick={() => {
                  onRemove?.()
                  setShowMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                Uninstall
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
