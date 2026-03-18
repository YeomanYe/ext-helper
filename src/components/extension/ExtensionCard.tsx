import * as React from "react"
import { Settings, Trash2, Package, Power, PowerOff } from "lucide-react"
import { cn } from "@/utils"
import type { Extension, ViewMode } from "@/types"
import { Switch } from "@/components/common"

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
  viewMode = "compact",
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

  const isCard = viewMode === "card"

  // Card mode: horizontal layout with icon, info, and toggle switch
  // Compact mode: horizontal layout
  if (isCard) {
    // Card mode - horizontal layout with more details
    return (
      <div
        className={cn(
          "group relative flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white",
          "hover:border-gray-300 hover:shadow-md",
          "dark:border-gray-700 dark:bg-gray-800",
          !extension.enabled && "opacity-60",
          "w-full min-h-[80px]",
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
              className="w-12 h-12 rounded-lg object-cover shadow-sm"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
              <Package className="w-6 h-6 text-gray-400" />
            </div>
          )}
        </div>

        {/* Extension Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate" title={extension.name}>
            {extension.name}
          </h3>
          {extension.description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5" title={extension.description}>
              {extension.description}
            </p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            v{extension.version}
          </p>
        </div>

        {/* Toggle Switch */}
        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={extension.enabled}
            onCheckedChange={() => onToggle()}
          />
        </div>

        {/* Context Menu */}
        {showMenu && (
          <div
            ref={menuRef}
            className="absolute left-0 top-full z-50 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation()
                onToggle()
                setShowMenu(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              {extension.enabled ? (
                <>
                  <PowerOff className="h-4 w-4" />
                  禁用
                </>
              ) : (
                <>
                  <Power className="h-4 w-4" />
                  启用
                </>
              )}
            </button>
            {extension.optionsUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onOpenOptions?.()
                  setShowMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Settings className="h-4 w-4" />
                设置页面
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                onRemove?.()
                setShowMenu(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
              卸载
            </button>
          </div>
        )}
      </div>
    )
  }

  // Compact mode - vertical layout with fixed size
  return (
    <div
      className={cn(
        "group relative flex flex-col items-center justify-center p-4 rounded-xl border border-gray-200 bg-white",
        "hover:border-gray-300 hover:shadow-md",
        "dark:border-gray-700 dark:bg-gray-800",
        !extension.enabled && "opacity-60",
        "w-[130px] h-[120px]",
        className
      )}
      onContextMenu={handleContextMenu}
      onClick={() => onToggle()}
    >
      {/* Extension Icon */}
      <div className="flex-shrink-0 mb-2">
        {extension.iconUrl ? (
          <img
            src={extension.iconUrl}
            alt={extension.name}
            className="w-12 h-12 rounded-lg object-cover shadow-sm"
            loading="lazy"
          />
        ) : (
          <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
            <Package className="w-6 h-6 text-gray-400" />
          </div>
        )}
      </div>

      {/* Extension Name - truncated */}
      <div className="w-full">
        <h3 className="text-xs font-medium text-gray-900 dark:text-gray-100 text-center truncate" title={extension.name}>
          {extension.name}
        </h3>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <div
          ref={menuRef}
          className="absolute left-0 top-full z-50 mt-1 w-40 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onToggle()
              setShowMenu(false)
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            {extension.enabled ? (
              <>
                <PowerOff className="h-4 w-4" />
                禁用
              </>
            ) : (
              <>
                <Power className="h-4 w-4" />
                启用
              </>
            )}
          </button>
          {extension.optionsUrl && (
            <button
              onClick={() => {
                onOpenOptions?.()
                setShowMenu(false)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <Settings className="h-4 w-4" />
              设置页面
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
            卸载
          </button>
        </div>
      )}
    </div>
  )
}
