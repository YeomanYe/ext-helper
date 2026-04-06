import * as React from "react"
import { Power, Folder, X } from "lucide-react"
import { cn } from "@/utils"
import { SearchBar } from "@/components/popup"
import type { Action } from "@/rules/types"
import { useExtensionStore } from "@/stores/extensionStore"
import { useGroupStore } from "@/stores/groupStore"

interface ActionBuilderProps {
  actions: Action[]
  onChange: (actions: Action[]) => void
}

type ActionFilterType = "all" | "extensions" | "groups"

export function ActionBuilder({ actions, onChange }: ActionBuilderProps) {
  const { extensions } = useExtensionStore()
  const { groups } = useGroupStore()
  const [searchQuery, setSearchQuery] = React.useState("")
  const [activeFilter, setActiveFilter] = React.useState<ActionFilterType>("all")

  // Get currently selected IDs
  const enabledExtensions = actions
    .filter(a => a.type === "enableExtension")
    .map(a => a.targetId)
  const disabledExtensions = actions
    .filter(a => a.type === "disableExtension")
    .map(a => a.targetId)
  const enabledGroups = actions
    .filter(a => a.type === "enableGroup")
    .map(a => a.targetId)
  const disabledGroups = actions
    .filter(a => a.type === "disableGroup")
    .map(a => a.targetId)

  // Filtered extensions
  const filteredExtensions = React.useMemo(() => {
    if (!searchQuery.trim()) return extensions
    const query = searchQuery.toLowerCase()
    return extensions.filter(ext => ext.name.toLowerCase().includes(query))
  }, [extensions, searchQuery])

  // Filtered groups
  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return groups
    const query = searchQuery.toLowerCase()
    return groups.filter(grp => grp.name.toLowerCase().includes(query))
  }, [groups, searchQuery])

  const toggleExtensionEnable = (extId: string) => {
    if (enabledExtensions.includes(extId)) {
      onChange(actions.filter(a => !(a.type === "enableExtension" && a.targetId === extId)))
    } else {
      const newActions = actions.filter(a => !(a.type === "disableExtension" && a.targetId === extId))
      newActions.push({ type: "enableExtension", targetId: extId })
      onChange(newActions)
    }
  }

  const toggleExtensionDisable = (extId: string) => {
    if (disabledExtensions.includes(extId)) {
      onChange(actions.filter(a => !(a.type === "disableExtension" && a.targetId === extId)))
    } else {
      const newActions = actions.filter(a => !(a.type === "enableExtension" && a.targetId === extId))
      newActions.push({ type: "disableExtension", targetId: extId })
      onChange(newActions)
    }
  }

  const toggleGroupEnable = (groupId: string) => {
    if (enabledGroups.includes(groupId)) {
      onChange(actions.filter(a => !(a.type === "enableGroup" && a.targetId === groupId)))
    } else {
      const newActions = actions.filter(a => !(a.type === "disableGroup" && a.targetId === groupId))
      newActions.push({ type: "enableGroup", targetId: groupId })
      onChange(newActions)
    }
  }

  const toggleGroupDisable = (groupId: string) => {
    if (disabledGroups.includes(groupId)) {
      onChange(actions.filter(a => !(a.type === "disableGroup" && a.targetId === groupId)))
    } else {
      const newActions = actions.filter(a => !(a.type === "enableGroup" && a.targetId === groupId))
      newActions.push({ type: "disableGroup", targetId: groupId })
      onChange(newActions)
    }
  }

  // Combine all items for compact view
  const allItems = React.useMemo(() => {
    const extItems = filteredExtensions.map(ext => ({
      id: ext.id,
      type: "extension" as const,
      name: ext.name,
      iconUrl: ext.iconUrl,
      isEnabled: enabledExtensions.includes(ext.id),
      isDisabled: disabledExtensions.includes(ext.id),
      onEnable: () => toggleExtensionEnable(ext.id),
      onDisable: () => toggleExtensionDisable(ext.id)
    }))

    const groupItems = filteredGroups.map(grp => ({
      id: grp.id,
      type: "group" as const,
      name: grp.name,
      color: grp.color,
      isEnabled: enabledGroups.includes(grp.id),
      isDisabled: disabledGroups.includes(grp.id),
      onEnable: () => toggleGroupEnable(grp.id),
      onDisable: () => toggleGroupDisable(grp.id)
    }))

    return [...extItems, ...groupItems]
  }, [filteredExtensions, filteredGroups, enabledExtensions, disabledExtensions, enabledGroups, disabledGroups])

  return (
    <div className="space-y-2">
      {/* Search and Filter */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="SEARCH_EXTENSIONS..."
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
      />

      {/* Compact Grid */}
      {(activeFilter === "all" || activeFilter === "extensions") && filteredExtensions.length > 0 && (
        <div>
          <p className="font-punk-heading text-[12px] text-punk-text-muted uppercase tracking-wider mb-1">
            EXTENSIONS
          </p>
          <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
            {filteredExtensions.map((ext) => (
              <div
                key={ext.id}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 border transition-all",
                  enabledExtensions.includes(ext.id)
                    ? "border-punk-success/50 bg-punk-success/5"
                    : disabledExtensions.includes(ext.id)
                      ? "border-punk-cta/50 bg-punk-cta/5"
                      : "border-punk-border/20 bg-punk-bg hover:border-punk-border/50"
                )}
              >
                {/* Icon */}
                {ext.iconUrl ? (
                  <img src={ext.iconUrl} className="h-5 w-5 object-cover flex-shrink-0" alt="" />
                ) : (
                  <div className="h-5 w-5 bg-punk-bg-alt flex items-center justify-center flex-shrink-0">
                    <span className="font-punk-heading text-[10px] text-punk-text-muted">
                      {ext.name[0]}
                    </span>
                  </div>
                )}

                {/* Name */}
                <span className="flex-1 font-punk-heading text-[11px] text-punk-text-primary uppercase truncate">
                  {ext.name}
                </span>

                {/* ON/OFF */}
                <div className="flex gap-0.5">
                  <button
                    onClick={() => toggleExtensionEnable(ext.id)}
                    className={cn(
                      "px-1 py-0.5 text-[10px] font-punk-heading transition-all",
                      enabledExtensions.includes(ext.id)
                        ? "bg-punk-success text-white"
                        : "text-punk-text-muted hover:text-punk-success"
                    )}
                  >
                    ON
                  </button>
                  <button
                    onClick={() => toggleExtensionDisable(ext.id)}
                    className={cn(
                      "px-1 py-0.5 text-[10px] font-punk-heading transition-all",
                      disabledExtensions.includes(ext.id)
                        ? "bg-punk-cta text-white"
                        : "text-punk-text-muted hover:text-punk-cta"
                    )}
                  >
                    OFF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Groups Grid - Same card style as extensions */}
      {(activeFilter === "all" || activeFilter === "groups") && filteredGroups.length > 0 && (
        <div>
          <p className="font-punk-heading text-[12px] text-punk-text-muted uppercase tracking-wider mb-1">
            SECTORS
          </p>
          <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
          {filteredGroups.map((group) => {
            const isSelected = enabledGroups.includes(group.id) || disabledGroups.includes(group.id)
            return (
              <div
                key={group.id}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 border transition-all",
                  enabledGroups.includes(group.id)
                    ? "border-punk-success/50 bg-punk-success/5"
                    : disabledGroups.includes(group.id)
                      ? "border-punk-cta/50 bg-punk-cta/5"
                      : "border-punk-border/20 bg-punk-bg hover:border-punk-border/50"
                )}
              >
                {/* Icon */}
                {group.iconUrl ? (
                  <img src={group.iconUrl} className="h-5 w-5 object-cover flex-shrink-0" alt="" />
                ) : (
                  <div
                    className="h-5 w-5 rounded-sm flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: group.color + "20" }}
                  >
                    <Folder className="w-3 h-3" style={{ color: group.color }} />
                  </div>
                )}

                {/* Name */}
                <span className={cn(
                  "flex-1 font-punk-heading text-[11px] uppercase truncate",
                  isSelected ? "text-punk-text-primary" : "text-punk-text-muted"
                )}>
                  {group.name}
                </span>

                {/* ON/OFF buttons */}
                <div className="flex gap-0.5">
                  <button
                    onClick={() => toggleGroupEnable(group.id)}
                    className={cn(
                      "px-1 py-0.5 text-[10px] font-punk-heading transition-all",
                      enabledGroups.includes(group.id)
                        ? "bg-punk-success text-white"
                        : "text-punk-text-muted hover:text-punk-success"
                    )}
                  >
                    ON
                  </button>
                  <button
                    onClick={() => toggleGroupDisable(group.id)}
                    className={cn(
                      "px-1 py-0.5 text-[10px] font-punk-heading transition-all",
                      disabledGroups.includes(group.id)
                        ? "bg-punk-cta text-white"
                        : "text-punk-text-muted hover:text-punk-cta"
                    )}
                  >
                    OFF
                  </button>
                </div>
              </div>
            )
          })}
        </div>
        </div>
      )}

      {/* Empty state */}
      {extensions.length === 0 && groups.length === 0 && (
        <p className="font-punk-code text-[12px] text-punk-text-muted py-4 text-center">
          NO EXTENSIONS OR SECTORS AVAILABLE
        </p>
      )}
    </div>
  )
}
