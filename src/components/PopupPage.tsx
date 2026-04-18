import * as React from "react"
import { Header, Footer, ExtensionsActionsMenu } from "@/components/popup"
import { ExtensionsTab } from "@/components/popup/ExtensionsTab"
import { RuleManager } from "@/components/rules"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import {
  useExtensionStore,
  useFilteredExtensions,
  useGroupStore,
  useUIStore,
  initializeUIStore,
} from "@/stores"
import { cn } from "@/utils"

type TabType = "extensions" | "rules"

export function PopupPage() {
  const viewMode = useUIStore((s) => s.viewMode)
  const setViewMode = useUIStore((s) => s.setViewMode)
  const fetchExtensions = useExtensionStore((s) => s.fetchExtensions)
  const fetchGroups = useGroupStore((s) => s.fetchGroups)

  const totalExtensionsEnabled = useExtensionStore(
    (s) => s.extensions.filter((e) => e.enabled).length
  )
  const totalExtensions = useExtensionStore((s) => s.extensions.length)

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

  React.useEffect(() => {
    initializeUIStore()
    fetchExtensions()
    fetchGroups()
  }, [fetchExtensions, fetchGroups])

  const isBisectActive = bisectSession.active
  const isBisectResolved = bisectSession.phase === "resolved"

  return (
    <div className="flex h-[600px] flex-col bg-punk-bg">
      <Header viewMode={viewMode} onViewModeChange={setViewMode} />

      {/* Tab Bar */}
      <div className="flex-shrink-0 px-3 pt-2 border-b border-punk-border/30">
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
          {activeTab === "extensions" ? <ExtensionsTab /> : <RuleManager />}
        </ErrorBoundary>
      </div>

      <Footer
        totalCount={activeTab === "extensions" ? filteredExtensions.length : totalExtensions}
        enabledCount={activeTab === "extensions" ? filteredEnabledCount : totalExtensionsEnabled}
      />
    </div>
  )
}
