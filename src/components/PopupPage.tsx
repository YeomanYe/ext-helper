import * as React from "react"
import { Header, Footer, SearchBar, QuickFilters } from "@/components/popup"
import { ExtensionCard } from "@/components/extension"
import { GroupChip, CreateGroupChip, GroupDetailModal } from "@/components/group"
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
    createGroup,
    addToGroup,
    removeFromGroup
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

  // Modal state
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null)

  // Get selected group
  const selectedGroup = React.useMemo(() => {
    if (!selectedGroupId) return null
    return displayGroups.find(g => g.id === selectedGroupId) || null
  }, [selectedGroupId, displayGroups])

  // Get extensions in selected group
  const selectedGroupExtensions = React.useMemo(() => {
    if (!selectedGroup) return []
    return displayExtensions.filter(ext => selectedGroup.extensionIds.includes(ext.id))
  }, [selectedGroup, displayExtensions])

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
  const handleToggleGroup = React.useCallback((group: typeof displayGroups[0]) => {
    const groupExtIds = group.extensionIds
    groupExtIds.forEach(id => {
      if (!devMode) {
        toggleExtension(id)
      } else {
        console.log("Toggle extension in group:", id)
      }
    })
  }, [devMode, toggleExtension])

  const enabledCount = displayedExtensions.filter((e) => e.enabled).length
  const totalCount = devMode ? MOCK_EXTENSIONS.length : filteredExtensions.length

  // Determine grid columns based on view mode
  // Card mode: single column (full-width cards with toggle switch)
  // Compact mode: 4 columns (smaller cards)
  const gridClass = viewMode === "card"
    ? "grid grid-cols-1 gap-2"
    : "grid grid-cols-4 gap-2"

  return (
    <div className="flex h-[600px] flex-col bg-punk-bg">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Search */}
      <div className="flex-shrink-0 p-3 border-b border-punk-border/30">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      {/* Group Chips */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-punk-border/30">
        <div className="flex flex-wrap gap-2">
          {/* Group chips */}
          {displayGroups.map((group) => {
            const count = displayExtensions.filter(ext => group.extensionIds.includes(ext.id)).length
            return (
              <GroupChip
                key={group.id}
                group={group}
                extensionCount={count}
                onClick={() => setSelectedGroupId(group.id)}
                onToggle={() => handleToggleGroup(group)}
              />
            )
          })}

          {/* Create group chip */}
          <CreateGroupChip onClick={() => createGroup("新分组", "#7C3AED")} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-punk-border/30">
        <QuickFilters activeFilter={filter} onFilterChange={setFilter} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="font-punk-body text-base text-punk-cta">ERROR: {error}</p>
            <button
              onClick={() => fetchExtensions()}
              className="mt-3 font-punk-btn px-4 py-2 punk-btn-primary"
            >
              RETRY
            </button>
          </div>
        ) : (
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
        )}
      </div>

      <Footer totalCount={totalCount} enabledCount={enabledCount} />

      {/* Group Detail Modal */}
      {selectedGroup && (
        <GroupDetailModal
          group={selectedGroup}
          extensions={selectedGroupExtensions}
          allExtensions={displayExtensions}
          viewMode={viewMode}
          onClose={() => setSelectedGroupId(null)}
          onToggleExtension={handleToggleExtension}
          onOpenOptions={handleOpenOptions}
          onRemove={handleRemove}
          onAddExtension={addToGroup}
          onRemoveFromGroup={removeFromGroup}
        />
      )}
    </div>
  )
}
