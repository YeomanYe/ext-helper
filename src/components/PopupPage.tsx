import * as React from "react"
import { Header, Footer, SearchBar, QuickFilters } from "@/components/popup"
import { ExtensionList, ExtensionCard } from "@/components/extension"
import { GroupCard, CreateGroupCard } from "@/components/group"
import {
  useExtensionStore,
  useFilteredExtensions,
  useGroupStore,
  initializeUIStore
} from "@/stores"
import { browserAdapter } from "@/services/browser/adapter"
import { MOCK_EXTENSIONS, MOCK_GROUPS, isDevMode } from "@/services/mockData"

export function PopupPage() {
  const {
    loading,
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
    activeGroupId,
    expandedGroups,
    fetchGroups,
    toggleGroupExpanded,
    createGroup,
    deleteGroup
  } = useGroupStore()

  const filteredExtensions = useFilteredExtensions()
  const devMode = isDevMode()

  // Use mock data in dev mode
  const displayExtensions = devMode ? MOCK_EXTENSIONS : filteredExtensions
  const displayGroups = devMode ? MOCK_GROUPS : groups

  // Filter extensions by active group
  const displayedExtensions = React.useMemo(() => {
    if (!activeGroupId) return displayExtensions
    const group = displayGroups.find((g) => g.id === activeGroupId)
    if (!group) return displayExtensions
    return displayExtensions.filter((ext) => group.extensionIds.includes(ext.id))
  }, [displayExtensions, activeGroupId, displayGroups])

  // Group extensions by their groups
  const extensionsByGroup = React.useMemo(() => {
    const map = new Map<string, typeof displayExtensions>()

    // Add grouped extensions
    displayGroups.forEach(group => {
      const groupExts = displayExtensions.filter(ext => group.extensionIds.includes(ext.id))
      if (groupExts.length > 0) {
        map.set(group.id, groupExts)
      }
    })

    return map
  }, [displayExtensions, displayGroups])

  // Get ungrouped extensions
  const ungroupedExtensions = React.useMemo(() => {
    const groupedIds = new Set<string>()
    displayGroups.forEach(g => g.extensionIds.forEach(id => groupedIds.add(id)))
    return displayExtensions.filter(ext => !groupedIds.has(ext.id))
  }, [displayExtensions, displayGroups])

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
      // Toggle in mock data
      console.log("Toggle extension:", id)
    }
  }, [devMode, toggleExtension])

  const enabledCount = displayedExtensions.filter((e) => e.enabled).length

  // Calculate total for footer
  const totalCount = devMode ? MOCK_EXTENSIONS.length : filteredExtensions.length

  return (
    <div className="flex h-[600px] flex-col bg-white dark:bg-gray-900">
      <Header />

      {/* Search and Filters */}
      <div className="flex-shrink-0 space-y-2 border-b border-gray-200 p-3 dark:border-gray-700">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
        <QuickFilters activeFilter={filter} onFilterChange={setFilter} />
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
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
        ) : devMode ? (
          // Dev mode: Show groups with horizontal cards
          <>
            {/* Group Cards */}
            {displayGroups.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                extensions={extensionsByGroup.get(group.id) || []}
                isExpanded={expandedGroups.has(group.id)}
                onToggleExpand={() => toggleGroupExpanded(group.id)}
                onDelete={() => deleteGroup(group.id)}
                onRename={() => {}}
                onToggleExtension={handleToggleExtension}
              />
            ))}

            {/* Ungrouped Extensions */}
            {ungroupedExtensions.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <span className="flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-100">
                    未分组
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({ungroupedExtensions.length})
                  </span>
                </div>
                <div className="p-3">
                  <div className="grid grid-cols-2 gap-3">
                    {ungroupedExtensions.map((ext) => (
                      <ExtensionCard
                        key={ext.id}
                        extension={ext}
                        onToggle={() => handleToggleExtension(ext.id)}
                        onOpenOptions={() => handleOpenOptions(ext.id)}
                        onRemove={() => handleRemove(ext.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Create Group Button */}
            <CreateGroupCard onClick={() => createGroup("新分组", "#6366F1")} />
          </>
        ) : (
          // Production mode: Show extension list
          <ExtensionList
            extensions={displayedExtensions}
            onToggle={toggleExtension}
            onOpenOptions={handleOpenOptions}
            onRemove={handleRemove}
            loading={loading}
          />
        )}
      </div>

      <Footer totalCount={totalCount} enabledCount={enabledCount} />
    </div>
  )
}
