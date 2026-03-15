import * as React from "react"
import { Header, Footer, SearchBar, QuickFilters } from "@/components/popup"
import { ExtensionList } from "@/components/extension"
import { GroupManager } from "@/components/group"
import {
  useExtensionStore,
  useFilteredExtensions,
  useGroupStore,
  initializeUIStore
} from "@/stores"
import { browserAdapter } from "@/services/browser/adapter"

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

  const { groups, activeGroupId, expandedGroups, fetchGroups, selectGroup, toggleGroupExpanded, createGroup, deleteGroup, renameGroup } = useGroupStore()

  const filteredExtensions = useFilteredExtensions()

  // Filter extensions by active group
  const displayedExtensions = React.useMemo(() => {
    if (!activeGroupId) return filteredExtensions
    const group = groups.find((g) => g.id === activeGroupId)
    if (!group) return filteredExtensions
    return filteredExtensions.filter((ext) => group.extensionIds.includes(ext.id))
  }, [filteredExtensions, activeGroupId, groups])

  // Initialize on mount
  React.useEffect(() => {
    initializeUIStore()
    fetchExtensions()
    fetchGroups()
  }, [fetchExtensions, fetchGroups])

  const handleOpenOptions = React.useCallback(async (id: string) => {
    try {
      await browserAdapter.openOptionsPage(id)
    } catch (err) {
      console.error("Failed to open options page:", err)
    }
  }, [])

  const handleRemove = React.useCallback(async (id: string) => {
    try {
      await browserAdapter.uninstallExtension(id)
      fetchExtensions()
    } catch (err) {
      console.error("Failed to uninstall extension:", err)
    }
  }, [fetchExtensions])

  const enabledCount = filteredExtensions.filter((e) => e.enabled).length

  return (
    <div className="flex h-[600px] flex-col bg-white dark:bg-gray-900">
      <Header />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-48 flex-shrink-0 border-r border-gray-200 bg-gray-50 p-2 overflow-y-auto dark:border-gray-700 dark:bg-gray-800">
          <GroupManager
            groups={groups}
            extensions={filteredExtensions}
            activeGroupId={activeGroupId}
            expandedGroups={expandedGroups}
            onSelectGroup={selectGroup}
            onToggleExpanded={toggleGroupExpanded}
            onCreateGroup={createGroup}
            onDeleteGroup={deleteGroup}
            onRenameGroup={renameGroup}
          />
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Search and Filters */}
          <div className="flex-shrink-0 space-y-2 border-b border-gray-200 p-3 dark:border-gray-700">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <QuickFilters activeFilter={filter} onFilterChange={setFilter} />
          </div>

          {/* Extension List */}
          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <p className="text-sm text-error">{error}</p>
                <button
                  onClick={() => fetchExtensions()}
                  className="mt-2 text-sm text-primary hover:underline"
                >
                  Retry
                </button>
              </div>
            ) : (
              <ExtensionList
                extensions={displayedExtensions}
                onToggle={toggleExtension}
                onOpenOptions={handleOpenOptions}
                onRemove={handleRemove}
                loading={loading}
              />
            )}
          </div>
        </main>
      </div>

      <Footer totalCount={filteredExtensions.length} enabledCount={enabledCount} />
    </div>
  )
}
