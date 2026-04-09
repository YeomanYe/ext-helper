import * as React from "react"
import { Header, Footer, SearchBar, ExtensionsActionsMenu, BisectBanner } from "@/components/popup"
import { ExtensionCard } from "@/components/extension"
import { GroupModal, GroupsBar } from "@/components/group"
import { RuleManager } from "@/components/rules"
import {
  useExtensionStore,
  useFilteredExtensions,
  useGroupStore,
  useUIStore,
  initializeUIStore
} from "@/stores"
import { browserAdapter } from "@/services/browser/adapter"
import { isDevMode } from "@/services/mockData"
import { cn } from "@/utils"

type TabType = "extensions" | "rules"

export function PopupPage() {
  const {
    error,
    searchQuery,
    filter,
    extensions,
    setSearchQuery,
    setFilter,
    fetchExtensions,
    toggleExtension,
    removeExtension,
    setExtensionsEnabled,
    undoExtensions,
    redoExtensions,
    startBisect,
    markBisectGood,
    markBisectBad,
    cancelBisect,
    finishBisectRestore,
    canUndo,
    canRedo,
    undoCount,
    redoCount,
    bisectSession
  } = useExtensionStore()

  const {
    groups,
    fetchGroups,
    createGroup,
    addToGroup,
    removeFromGroup,
    updateGroup,
    deleteGroup
  } = useGroupStore()

  const {
    viewMode,
    setViewMode
  } = useUIStore()

  const filteredExtensions = useFilteredExtensions()
  const devMode = isDevMode()

  // Tab state
  const [activeTab, setActiveTab] = React.useState<TabType>("extensions")

  // Use store data (stores use devStorage in dev mode)
  const displayExtensions = extensions
  const displayGroups = groups

  // Modal state
  const [selectedGroupId, setSelectedGroupId] = React.useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = React.useState(false)

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

  const displayedExtensions = filteredExtensions
  const bisectResultExtension = React.useMemo(
    () => extensions.find((extension) => extension.id === bisectSession.resultId) ?? null,
    [bisectSession.resultId, extensions]
  )
  const isBisectActive = bisectSession.active
  const isBisectResolved = bisectSession.phase === "resolved"

  // Initialize on mount
  React.useEffect(() => {
    initializeUIStore()
    fetchExtensions()
    fetchGroups()
  }, [fetchExtensions, fetchGroups])

  const handleOpenOptions = React.useCallback(async (id: string) => {
    const ext = extensions.find((e) => e.id === id)
    if (!ext?.optionsUrl) return
    if (devMode) {
      window.open(ext.optionsUrl, "_blank")
      return
    }
    try {
      await browserAdapter.openOptionsPage(ext.optionsUrl)
    } catch (err) {
      console.error("Failed to open options page:", err)
    }
  }, [devMode, extensions])

  const handleRemoveExtension = React.useCallback(async (id: string) => {
    if (devMode) {
      await removeExtension(id)
      return
    }
    try {
      await browserAdapter.uninstallExtension(id)
      fetchExtensions()
    } catch (err) {
      console.error("Failed to uninstall extension:", err)
    }
  }, [devMode, fetchExtensions, removeExtension])

  const handleToggleExtension = React.useCallback((id: string) => {
    if (isBisectActive) return
    toggleExtension(id)
  }, [isBisectActive, toggleExtension])

  // Toggle all extensions in a group
  const handleToggleGroup = React.useCallback((group: typeof displayGroups[0]) => {
    if (isBisectActive) return
    const groupExtensions = displayExtensions.filter((ext) => group.extensionIds.includes(ext.id))
    if (groupExtensions.length === 0) return

    const shouldEnableAll = groupExtensions.some((ext) => !ext.enabled)
    void setExtensionsEnabled(groupExtensions.map((ext) => ext.id), shouldEnableAll)
  }, [displayExtensions, isBisectActive, setExtensionsEnabled])

  const enabledCount = displayedExtensions.filter((e) => e.enabled).length
  const totalCount = displayedExtensions.length

  // Determine grid columns based on view mode
  // Card mode: flex-wrap, multiple cards per row
  // Compact mode: CSS grid with auto-fill to fill screen width
  // Detail mode: single column stacked layout
  const gridClass = viewMode === "card"
    ? "flex flex-wrap gap-2"
    : viewMode === "compact"
      ? "grid grid-cols-[repeat(auto-fill,minmax(80px,1fr))] gap-2"
      : "flex flex-col gap-2"

  return (
    <div className="flex h-[600px] flex-col bg-punk-bg">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Tab Bar */}
      <div className="flex-shrink-0 px-3 pt-2 border-b border-punk-border/30">
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab("extensions")}
              className={cn(
                "px-3 py-2 text-[13px] font-punk-heading uppercase tracking-wider transition-all",
                activeTab === "extensions"
                  ? "text-punk-accent border-b-2 border-punk-accent"
                  : "text-punk-text-muted hover:text-punk-text-primary"
              )}
            >
              EXTENSIONS
            </button>
            <button
              onClick={() => setActiveTab("rules")}
              className={cn(
                "px-3 py-2 text-[13px] font-punk-heading uppercase tracking-wider transition-all",
                activeTab === "rules"
                  ? "text-punk-accent border-b-2 border-punk-accent"
                  : "text-punk-text-muted hover:text-punk-text-primary"
              )}
            >
              RULES
            </button>
          </div>
          {activeTab === "extensions" && (
            <ExtensionsActionsMenu
              enabledExtensionCount={extensions.filter((ext) => ext.enabled).length}
              isBisectActive={isBisectActive}
              isBisectResolved={isBisectResolved}
              canUndo={canUndo}
              canRedo={canRedo}
              undoCount={undoCount}
              redoCount={redoCount}
              onStartBisect={() => void startBisect()}
              onBisectGood={() => void markBisectGood()}
              onBisectBad={() => void markBisectBad()}
              onCancelBisect={() => void cancelBisect()}
              onEnableAll={() => void setExtensionsEnabled(displayedExtensions.map((ext) => ext.id), true)}
              onDisableAll={() => void setExtensionsEnabled(displayedExtensions.map((ext) => ext.id), false)}
              onUndo={() => void undoExtensions()}
              onRedo={() => void redoExtensions()}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {activeTab === "extensions" ? (
          <>
            {/* Search */}
            <div className="flex-shrink-0 p-3 border-b border-punk-border/30">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                activeFilter={filter}
                onFilterChange={setFilter}
              />
            </div>

            <BisectBanner
              bisectSession={bisectSession}
              resultExtension={bisectResultExtension}
              onGood={() => void markBisectGood()}
              onBad={() => void markBisectBad()}
              onCancel={() => void cancelBisect()}
              onRestore={() => void finishBisectRestore()}
            />

            <GroupsBar
              groups={displayGroups}
              extensions={displayExtensions}
              disabled={isBisectActive}
              onSelectGroup={setSelectedGroupId}
              onToggleGroup={handleToggleGroup}
              onCreateGroup={() => setShowCreateModal(true)}
            />

            {/* Extension List */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-3"
              data-extension-surface="true"
            >
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
                <div className={gridClass}>
                  {displayedExtensions.map((ext) => (
                    <ExtensionCard
                      key={ext.id}
                      extension={ext}
                      viewMode={viewMode}
                      disableEnableControls={isBisectActive}
                      disableRemove={isBisectActive}
                      onToggle={handleToggleExtension}
                      onOpenOptions={handleOpenOptions}
                      onRemove={handleRemoveExtension}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Rules Panel */
          <RuleManager />
        )}
      </div>

      <Footer totalCount={totalCount} enabledCount={enabledCount} />

      {/* Unified Group Modal */}
      {(selectedGroup || showCreateModal) && (
        <GroupModal
          group={selectedGroup ?? undefined}
          extensions={selectedGroup ? selectedGroupExtensions : undefined}
          allExtensions={displayExtensions}
          onClose={() => {
            setSelectedGroupId(null)
            setShowCreateModal(false)
          }}
          onCreate={showCreateModal ? async (name, color, extensionIds, iconUrl) => {
            await createGroup(name, color, extensionIds)
            if (iconUrl) {
              const latestGroup = useGroupStore.getState().groups.at(-1)
              if (latestGroup) {
                updateGroup(latestGroup.id, { icon: "custom", iconUrl })
              }
            }
          } : undefined}
          disableEnableControls={isBisectActive}
          onToggleExtension={selectedGroup && !isBisectActive ? handleToggleExtension : undefined}
          onOpenOptions={selectedGroup ? handleOpenOptions : undefined}
          onRemove={selectedGroup && !isBisectActive ? handleRemoveExtension : undefined}
          onDeleteGroup={selectedGroup ? deleteGroup : undefined}
          onAddExtension={selectedGroup ? addToGroup : undefined}
          onRemoveFromGroup={selectedGroup ? removeFromGroup : undefined}
          onUpdateGroup={selectedGroup ? updateGroup : undefined}
        />
      )}
    </div>
  )
}
