import * as React from "react"
import { Header, Footer, SearchBar, QuickFilters } from "@/components/popup"
import { ExtensionCard } from "@/components/extension"
import { GroupChip, CreateGroupChip } from "@/components/group"
import {
  useExtensionStore,
  useFilteredExtensions,
  useGroupStore,
  useUIStore,
  initializeUIStore
} from "@/stores"
import { browserAdapter } from "@/services/browser/adapter"
import { MOCK_EXTENSIONS, MOCK_GROUPS, isDevMode } from "@/services/mockData"

export function PopupPage() {
  const {
    error,
    searchQuery,
    filter,
    setSearchQuery,
    setFilter,
    fetchExtensions,
    toggleExtension
  } = useExtensionStore()

  const {
    groups,
    fetchGroups,
    createGroup
  } = useGroupStore()

  const {
    viewMode,
    setViewMode
  } = useUIStore()

  const filteredExtensions = useFilteredExtensions()
  const devMode = isDevMode()

  // Use mock data in dev mode
  const displayExtensions = devMode ? MOCK_EXTENSIONS : filteredExtensions
  const displayGroups = devMode ? MOCK_GROUPS : groups

  // Filter extensions based on filter
  const displayedExtensions = React.useMemo(() => {
    if (filter === "enabled") {
      return displayExtensions.filter(e => e.enabled)
    } else if (filter === "disabled") {
      return displayExtensions.filter(e => !e.enabled)
    }
    return displayExtensions
  }, [displayExtensions, filter])

  // Initialize on mount
  React.useEffect(() => {
    initializeUIStore()
    if (!devMode) {
      fetchExtensions()
      fetchGroups()
    }
  }, [devMode, fetchExtensions, fetchGroups])

  const handleOpenOptions = React.useCallback(async (id: string) => {
    if (devMode) return
    try {
      await browserAdapter.openOptionsPage(id)
    } catch (err) {
      console.error("Failed to open options page:", err)
    }
  }, [devMode])

  const handleRemove = React.useCallback(async (id: string) => {
    if (devMode) return
    try {
      await browserAdapter.uninstallExtension(id)
      fetchExtensions()
    } catch (err) {
      console.error("Failed to uninstall extension:", err)
    }
  }, [devMode, fetchExtensions])

  const handleToggleExtension = React.useCallback((id: string) => {
    if (!devMode) {
      toggleExtension(id)
    } else {
      console.log("Toggle extension:", id)
    }
  }, [devMode, toggleExtension])

  // Toggle all extensions in a group
  const handleToggleGroup = React.useCallback((group: Group) => {
    const groupExtIds = group.extensionIds
    const allEnabled = groupExtIds.every(id => {
      const ext = displayExtensions.find(e => e.id === id)
      return ext?.enabled ?? false
    })

    // Toggle all to opposite state
    groupExtIds.forEach(id => {
      if (!devMode) {
        toggleExtension(id)
      } else {
        console.log("Toggle extension in group:", id, !allEnabled)
      }
    })
  }, [devMode, toggleExtension, displayExtensions])

  const enabledCount = displayedExtensions.filter((e) => e.enabled).length
  const totalCount = devMode ? MOCK_EXTENSIONS.length : filteredExtensions.length

  // Determine grid columns based on view mode
  // Card mode: single column (full-width cards with toggle switch)
  // Compact mode: 4 columns (smaller cards)
  const gridClass = viewMode === "card"
    ? "grid grid-cols-1 gap-2"
    : "grid grid-cols-4 gap-3"

  return (
    <div className="flex h-[600px] flex-col bg-white dark:bg-gray-900">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Search */}
      <div className="flex-shrink-0 p-3 border-b border-gray-200 dark:border-gray-700">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Group Chips */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-2">
          {/* All extensions chip */}
          <button
            onClick={() => selectGroup(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !activeGroupId
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            <span>全部</span>
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              !activeGroupId ? "bg-white/20" : "bg-gray-200 dark:bg-gray-600"
            }`}>
              {displayExtensions.length}
            </span>
          </button>

          {/* Group chips */}
          {displayGroups.map((group) => {
            const count = displayExtensions.filter(ext => group.extensionIds.includes(ext.id)).length
            const allEnabled = group.extensionIds.every(id => {
              const ext = displayExtensions.find(e => e.id === id)
              return ext?.enabled ?? false
            })
            return (
              <GroupChip
                key={group.id}
                group={group}
                extensionCount={count}
                onToggle={() => {
                  // Toggle all extensions in the group
                  group.extensionIds.forEach(id => {
                    if (!devMode) {
                      toggleExtension(id)
                    }
                  })
                }}
              />
            )
          })}

          {/* Create group chip */}
          <CreateGroupChip onClick={() => createGroup("新分组", "#6366F1")} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-gray-200 dark:border-gray-700">
        <QuickFilters activeFilter={filter} onFilterChange={setFilter} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-error">{error}</p>
            <button
              onClick={() => fetchExtensions()}
              className="mt-2 text-sm text-primary hover:underline"
            >
              重试
            </button>
          </div>
        ) : devMode || !activeGroupId ? (
          // Show all filtered extensions
          <div className={gridClass}>
            {displayedExtensions.map((ext) => (
              <ExtensionCard
                key={ext.id}
                extension={ext}
                viewMode={viewMode}
                onToggle={() => handleToggleExtension(ext.id)}
                onOpenOptions={() => handleOpenOptions(ext.id)}
                onRemove={() => handleRemove(ext.id)}
              />
            ))}
          </div>
        ) : (
          // Show only group extensions
          <div className={gridClass}>
            {displayedExtensions
              .filter(ext => {
                const group = displayGroups.find(g => g.id === activeGroupId)
                return group?.extensionIds.includes(ext.id)
              })
              .map((ext) => (
                <ExtensionCard
                  key={ext.id}
                  extension={ext}
                  viewMode={viewMode}
                  onToggle={() => handleToggleExtension(ext.id)}
                  onOpenOptions={() => handleOpenOptions(ext.id)}
                  onRemove={() => handleRemove(ext.id)}
                />
              ))}
          </div>
        )}
      </div>

      <Footer totalCount={totalCount} enabledCount={enabledCount} />
    </div>
  )
}
