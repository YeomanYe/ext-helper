import * as React from "react"
import { ChevronDown, ChevronRight, Folder, MoreVertical, Plus, Pencil, Trash2 } from "lucide-react"
import { ExtensionCard } from "@/components/extension"
import { cn } from "@/utils"
import type { Group, Extension } from "@/types"

interface GroupCardProps {
  group: Group
  extensions: Extension[]
  isExpanded: boolean
  onToggleExpand: () => void
  onDelete: () => void
  onRename: () => void
  onAddExtension?: () => void
  onToggleExtension: (id: string) => void
  onOpenOptions?: (id: string) => void
  onRemove?: (id: string) => void
}

export function GroupCard({
  group,
  extensions,
  isExpanded,
  onToggleExpand,
  onDelete,
  onRename,
  onAddExtension,
  onToggleExtension,
  onOpenOptions,
  onRemove
}: GroupCardProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
      {/* Group Header */}
      <div
        className={cn(
          "flex items-center gap-2 px-4 py-3 cursor-pointer",
          "hover:bg-gray-50 dark:hover:bg-gray-700/50",
          "transition-colors duration-150"
        )}
        onClick={onToggleExpand}
      >
        <button className="flex-shrink-0 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        <div
          className="flex-shrink-0 h-3 w-3 rounded-sm"
          style={{ backgroundColor: group.color }}
        />

        <Folder className="h-4 w-4 text-gray-500" />

        <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
          {group.name}
        </span>

        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({extensions.length})
        </span>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowMenu(!showMenu)
            }}
            className="flex h-7 w-7 items-center justify-center rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-600 dark:hover:text-gray-300"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-36 rounded-md border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onRename()
                  setShowMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Pencil className="h-4 w-4" />
                重命名
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete()
                  setShowMenu(false)
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
                删除
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Group Content - Extension Grid */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-700">
          {extensions.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {extensions.map((ext) => (
                <ExtensionCard
                  key={ext.id}
                  extension={ext}
                  onToggle={() => onToggleExtension(ext.id)}
                  onOpenOptions={() => onOpenOptions?.(ext.id)}
                  onRemove={() => onRemove?.(ext.id)}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Folder className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                暂无扩展
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onAddExtension?.()
                }}
                className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Plus className="h-4 w-4" />
                添加扩展
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface CreateGroupCardProps {
  onClick: () => void
}

export function CreateGroupCard({ onClick }: CreateGroupCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300",
        "px-4 py-3 text-sm text-gray-500",
        "hover:border-primary hover:text-primary",
        "dark:border-gray-600 dark:hover:border-primary",
        "transition-colors duration-150"
      )}
    >
      <Plus className="h-4 w-4" />
      新建分组
    </button>
  )
}
