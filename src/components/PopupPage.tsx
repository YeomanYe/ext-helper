import * as React from "react"
import { ChevronDown } from "lucide-react"
import { Header, Footer, SearchBar } from "@/components/popup"
import { ExtensionCard } from "@/components/extension"
import { GroupChip, CreateGroupChip, GroupModal } from "@/components/group"
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
    finishBisectKeepCurrent,
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
  const [showTabActions, setShowTabActions] = React.useState(false)
  const tabActionsRef = React.useRef<HTMLDivElement>(null)

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

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (tabActionsRef.current && !tabActionsRef.current.contains(event.target as Node)) {
        setShowTabActions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleOpenOptions = React.useCallback(async (id: string) => {
    if (devMode) return
    try {
      await browserAdapter.openOptionsPage(id)
    } catch (err) {
      console.error("Failed to open options page:", err)
    }
  }, [devMode])

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
  // Card mode: single column (full-width cards with toggle switch)
  // Compact mode: CSS grid with auto-fill to fill screen width
  // Detail mode: single column stacked layout
  const gridClass = viewMode === "card"
    ? "grid grid-cols-1 gap-2"
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
            <div className="relative ml-auto" ref={tabActionsRef}>
              <button
                onClick={() => setShowTabActions((value) => !value)}
                className="flex h-8 items-center gap-1 border border-punk-border/30 bg-punk-bg-alt px-2 text-[11px] font-punk-heading uppercase tracking-wider text-punk-text-muted transition-all hover:border-punk-accent/50 hover:text-punk-accent"
              >
                ACTIONS
                <ChevronDown className={cn("h-3 w-3 transition-transform", showTabActions && "rotate-180")} />
              </button>
              {showTabActions && (
                <div className="absolute right-0 top-full z-50 mt-1 w-40 border border-punk-border bg-punk-bg-alt shadow-[0_0_20px_rgba(124,58,237,0.3)]">
                  {!isBisectActive && (
                    <button
                      onClick={() => {
                        void startBisect()
                        setShowTabActions(false)
                      }}
                      disabled={extensions.filter((ext) => ext.enabled).length < 2}
                      className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Start Bisect
                    </button>
                  )}
                  {isBisectActive && !isBisectResolved && (
                    <>
                      <button
                        onClick={() => {
                          void markBisectGood()
                          setShowTabActions(false)
                        }}
                        className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-success transition-colors hover:bg-punk-bg"
                      >
                        Bisect Good
                      </button>
                      <button
                        onClick={() => {
                          void markBisectBad()
                          setShowTabActions(false)
                        }}
                        className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-cta transition-colors hover:bg-punk-bg"
                      >
                        Bisect Bad
                      </button>
                      <button
                        onClick={() => {
                          void cancelBisect()
                          setShowTabActions(false)
                        }}
                        className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary"
                      >
                        Cancel Bisect
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      void setExtensionsEnabled(displayedExtensions.map((ext) => ext.id), true)
                      setShowTabActions(false)
                    }}
                    disabled={isBisectActive}
                    className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary"
                  >
                    Enable All
                  </button>
                  <button
                    onClick={() => {
                      void setExtensionsEnabled(displayedExtensions.map((ext) => ext.id), false)
                      setShowTabActions(false)
                    }}
                    disabled={isBisectActive}
                    className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary"
                  >
                    Disable All
                  </button>
                  <button
                    onClick={() => {
                      void undoExtensions()
                      setShowTabActions(false)
                    }}
                    disabled={!canUndo || isBisectActive}
                    className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Undo [{undoCount}]
                  </button>
                  <button
                    onClick={() => {
                      void redoExtensions()
                      setShowTabActions(false)
                    }}
                    disabled={!canRedo || isBisectActive}
                    className="w-full px-3 py-2 text-left font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-secondary transition-colors hover:bg-punk-bg hover:text-punk-text-primary disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Redo [{redoCount}]
                  </button>
                </div>
              )}
            </div>
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

            {isBisectActive && (
              <div className="flex-shrink-0 border-b border-punk-border/30 bg-punk-bg px-3 py-3">
                <div className="border border-punk-warning/40 bg-punk-bg-alt px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-punk-heading text-[12px] uppercase tracking-wider text-punk-warning">
                        {isBisectResolved ? "Bisect Resolved" : `Bisect Step ${bisectSession.step}`}
                      </p>
                      <p className="font-punk-body text-sm text-punk-text-secondary">
                        {isBisectResolved
                          ? `Suspect: ${bisectResultExtension?.name ?? bisectSession.resultId ?? "Unknown extension"}`
                          : "Good means the issue disappeared. Bad means the issue is still present."}
                      </p>
                      <p className="font-punk-code text-[10px] uppercase tracking-wider text-punk-text-muted">
                        Candidates {bisectSession.candidateIds.length} · Testing {bisectSession.currentTestIds.length}
                      </p>
                    </div>
                    {!isBisectResolved && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void markBisectGood()}
                          className="border border-punk-success/50 bg-punk-success/10 px-3 py-1.5 font-punk-heading text-[11px] uppercase tracking-wider text-punk-success transition-colors hover:bg-punk-success/20"
                        >
                          Good
                        </button>
                        <button
                          onClick={() => void markBisectBad()}
                          className="border border-punk-cta/50 bg-punk-cta/10 px-3 py-1.5 font-punk-heading text-[11px] uppercase tracking-wider text-punk-cta transition-colors hover:bg-punk-cta/20"
                        >
                          Bad
                        </button>
                        <button
                          onClick={() => void cancelBisect()}
                          className="border border-punk-border/30 px-3 py-1.5 font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-muted transition-colors hover:border-punk-accent/50 hover:text-punk-text-primary"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                    {isBisectResolved && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void finishBisectRestore()}
                          className="border border-punk-border/30 px-3 py-1.5 font-punk-heading text-[11px] uppercase tracking-wider text-punk-text-muted transition-colors hover:border-punk-accent/50 hover:text-punk-text-primary"
                        >
                          Restore Original
                        </button>
                        <button
                          onClick={() => finishBisectKeepCurrent()}
                          className="border border-punk-warning/50 bg-punk-warning/10 px-3 py-1.5 font-punk-heading text-[11px] uppercase tracking-wider text-punk-warning transition-colors hover:bg-punk-warning/20"
                        >
                          Keep Current
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Group Chips */}
            <div className="flex-shrink-0 px-3 py-2 border-b border-punk-border/30">
              <div className="flex flex-wrap gap-2">
                {/* Group chips */}
                {displayGroups.map((group) => {
                  const groupExtensions = displayExtensions.filter(ext => group.extensionIds.includes(ext.id))
                  const count = groupExtensions.length
                  const allEnabled = count > 0 && groupExtensions.every((ext) => ext.enabled)
                  return (
                    <GroupChip
                      key={group.id}
                      group={group}
                      extensionCount={count}
                      allEnabled={allEnabled}
                      disabled={isBisectActive}
                      onClick={() => setSelectedGroupId(group.id)}
                      onToggle={() => handleToggleGroup(group)}
                    />
                  )
                })}

                {/* Create group chip */}
                <CreateGroupChip onClick={() => setShowCreateModal(true)} />
              </div>
            </div>

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
                      onToggle={() => handleToggleExtension(ext.id)}
                      onOpenOptions={() => handleOpenOptions(ext.id)}
                      onRemove={() => handleRemoveExtension(ext.id)}
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
            await createGroup(name, color)
            // Get fresh groups from store after state update
            const latestGroups = useGroupStore.getState().groups
            const latestGroup = latestGroups[latestGroups.length - 1]
            if (latestGroup) {
              // Add selected extensions to the new group
              if (extensionIds.length > 0) {
                extensionIds.forEach(extId => {
                  addToGroup(latestGroup.id, extId)
                })
              }
              // Update icon if provided
              if (iconUrl) {
                updateGroup(latestGroup.id, { icon: "custom", iconUrl })
              }
              // Keep the new group highlighted after creation
              setSelectedGroupId(latestGroup.id)
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
