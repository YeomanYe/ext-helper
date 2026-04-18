import * as React from "react"
import { Header, Footer } from "@/components/popup"
import { ExtensionsTab } from "@/components/popup/ExtensionsTab"
import { RuleManager } from "@/components/rules"
import { ErrorBoundary } from "@/components/common/ErrorBoundary"
import { useExtensionStore, useGroupStore, useUIStore, initializeUIStore } from "@/stores"
import { cn } from "@/utils"

type TabType = "extensions" | "rules"

export function PopupPage() {
  const viewMode = useUIStore((s) => s.viewMode)
  const setViewMode = useUIStore((s) => s.setViewMode)
  const fetchExtensions = useExtensionStore((s) => s.fetchExtensions)
  const fetchGroups = useGroupStore((s) => s.fetchGroups)

  const filteredExtensions = useExtensionStore((s) => {
    const { extensions } = s
    return extensions
  })
  const enabledCount = useExtensionStore((s) => s.extensions.filter((e) => e.enabled).length)

  const [activeTab, setActiveTab] = React.useState<TabType>("extensions")

  React.useEffect(() => {
    initializeUIStore()
    fetchExtensions()
    fetchGroups()
  }, [fetchExtensions, fetchGroups])

  const totalCount = filteredExtensions.length

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
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <ErrorBoundary>
          {activeTab === "extensions" ? <ExtensionsTab /> : <RuleManager />}
        </ErrorBoundary>
      </div>

      <Footer totalCount={totalCount} enabledCount={enabledCount} />
    </div>
  )
}
