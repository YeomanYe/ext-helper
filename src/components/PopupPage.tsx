import * as React from "react"
import { Header, Footer, ExtensionsActionsMenu, ImportExportDialog } from "@/components/popup"
import { ExtensionsTab } from "@/components/popup/ExtensionsTab"
import { UsageLogTab } from "@/components/popup/UsageLogTab"
import { RuleManager } from "@/components/rules"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import {
  useExtensionStore,
  useFilteredExtensions,
  useGroupStore,
  useRuleStore,
  useUsageLogStore,
  useUIStore,
  initializeUIStore,
} from "@/stores"
import { cn } from "@/utils"

type TabType = "extensions" | "rules" | "logs"
type ImportExportMode = "import" | "export"

export function PopupPage() {
  const viewMode = useUIStore((s) => s.viewMode)
  const setViewMode = useUIStore((s) => s.setViewMode)
  const fetchExtensions = useExtensionStore((s) => s.fetchExtensions)
  const fetchGroups = useGroupStore((s) => s.fetchGroups)
  const fetchRules = useRuleStore((s) => s.fetchRules)
  const fetchUsageLog = useUsageLogStore((s) => s.fetchUsageLog)

  const totalExtensionsEnabled = useExtensionStore(
    (s) => s.extensions.filter((e) => e.enabled).length
  )
  const totalExtensions = useExtensionStore((s) => s.extensions.length)
  const totalLogEvents = useUsageLogStore((s) => s.stats.total)

  const canUndo = useExtensionStore((s) => s.canUndo)
  const canRedo = useExtensionStore((s) => s.canRedo)
  const undoCount = useExtensionStore((s) => s.undoCount)
  const redoCount = useExtensionStore((s) => s.redoCount)
  const bisectSession = useExtensionStore((s) => s.bisectSession)

  const setExtensionsEnabled = useExtensionStore((s) => s.setExtensionsEnabled)
  const undoExtensions = useExtensionStore((s) => s.undoExtensions)
  const redoExtensions = useExtensionStore((s) => s.redoExtensions)
  const startBisect = useExtensionStore((s) => s.startBisect)
  const markBisectGood = useExtensionStore((s) => s.markBisectGood)
  const markBisectBad = useExtensionStore((s) => s.markBisectBad)
  const cancelBisect = useExtensionStore((s) => s.cancelBisect)

  const filteredExtensions = useFilteredExtensions()
  const filteredEnabledCount = filteredExtensions.filter((e) => e.enabled).length

  const [activeTab, setActiveTab] = React.useState<TabType>("extensions")
  const [importExportMode, setImportExportMode] = React.useState<ImportExportMode | null>(null)

  React.useEffect(() => {
    initializeUIStore()
    fetchExtensions()
    fetchGroups()
    fetchRules()
    fetchUsageLog()
  }, [fetchExtensions, fetchGroups, fetchRules, fetchUsageLog])

  const handleImportExportImported = React.useCallback(async () => {
    await Promise.all([fetchGroups(), fetchRules(), fetchUsageLog(), initializeUIStore()])
  }, [fetchGroups, fetchRules, fetchUsageLog])

  const openImportExport = React.useCallback((mode: ImportExportMode) => {
    setImportExportMode(mode)
  }, [])

  const isBisectActive = bisectSession.active
  const isBisectResolved = bisectSession.phase === "resolved"

  return (
    <div className="flex h-[600px] flex-col bg-punk-bg text-punk-text-primary">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onOpenImportExport={openImportExport}
      />
      <ImportExportDialog
        open={importExportMode !== null}
        mode={importExportMode ?? "import"}
        onClose={() => setImportExportMode(null)}
        onImported={handleImportExportImported}
      />

      {/* Tab Bar */}
      <div className="flex-shrink-0 border-b border-punk-border/30 bg-punk-surface-soft/45 px-3 pt-2">
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
          <button
            onClick={() => setActiveTab("logs")}
            className={cn(
              "px-3 py-2 text-[13px] font-punk-heading uppercase tracking-wider transition-all",
              activeTab === "logs"
                ? "text-punk-accent border-b-2 border-punk-accent"
                : "text-punk-text-muted hover:text-punk-text-primary"
            )}
          >
            LOGS
          </button>
          {activeTab === "extensions" && (
            <ExtensionsActionsMenu
              enabledExtensionCount={totalExtensionsEnabled}
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
              onEnableAll={() =>
                void setExtensionsEnabled(
                  filteredExtensions.map((ext) => ext.id),
                  true
                )
              }
              onDisableAll={() =>
                void setExtensionsEnabled(
                  filteredExtensions.map((ext) => ext.id),
                  false
                )
              }
              onUndo={() => void undoExtensions()}
              onRedo={() => void redoExtensions()}
            />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ErrorBoundary>
          {activeTab === "extensions" && <ExtensionsTab />}
          {activeTab === "rules" && <RuleManager />}
          {activeTab === "logs" && <UsageLogTab />}
        </ErrorBoundary>
      </div>

      <Footer
        totalCount={
          activeTab === "extensions"
            ? filteredExtensions.length
            : activeTab === "logs"
              ? totalLogEvents
              : totalExtensions
        }
        enabledCount={
          activeTab === "extensions"
            ? filteredEnabledCount
            : activeTab === "logs"
              ? totalLogEvents
              : totalExtensionsEnabled
        }
      />
    </div>
  )
}
