import * as React from "react"
import { Activity, Download, Power, PowerOff, Trash2, Upload } from "lucide-react"
import { Button } from "@/components/common/Button"
import { useUsageLogStore } from "@/stores"
import type { UsageLogAction, UsageLogEvent } from "@/types"
import { cn } from "@/utils"

const ACTION_LABELS: Record<UsageLogAction, string> = {
  enabled: "ENABLED",
  disabled: "DISABLED",
  installed: "INSTALLED",
  uninstalled: "REMOVED",
}

const ACTION_ICONS = {
  enabled: Power,
  disabled: PowerOff,
  installed: Download,
  uninstalled: Upload,
}

const formatTime = (timestamp: number): string =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(timestamp))

function StatTile({ action, count }: { action: UsageLogAction; count: number }) {
  const Icon = ACTION_ICONS[action]

  return (
    <div className="border border-punk-border/40 bg-punk-bg-alt/70 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-punk-body text-[11px] text-punk-text-muted">
          {ACTION_LABELS[action]}
        </span>
        <Icon className="h-3.5 w-3.5 text-punk-accent" />
      </div>
      <div className="mt-1 font-punk-heading text-xl text-punk-text-primary">{count}</div>
    </div>
  )
}

function EventRow({ event }: { event: UsageLogEvent }) {
  const Icon = ACTION_ICONS[event.action]

  return (
    <li className="border border-punk-border/30 bg-punk-bg-alt/50 px-3 py-2">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center border",
            event.action === "enabled" || event.action === "installed"
              ? "border-punk-success/50 text-punk-success"
              : "border-punk-cta/50 text-punk-cta"
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate font-punk-heading text-[13px] text-punk-text-primary">
              {event.extensionName || event.extensionId}
            </span>
            <span className="flex-shrink-0 font-punk-body text-[11px] text-punk-text-muted">
              {formatTime(event.timestamp)}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 font-punk-body text-[11px]">
            <span className="text-punk-accent">{ACTION_LABELS[event.action]}</span>
            <span className="text-punk-text-muted">SRC:{event.source.toUpperCase()}</span>
            <span className="max-w-full truncate text-punk-text-muted">ID:{event.extensionId}</span>
          </div>
        </div>
      </div>
    </li>
  )
}

export function UsageLogTab() {
  const events = useUsageLogStore((state) => state.events)
  const stats = useUsageLogStore((state) => state.stats)
  const loading = useUsageLogStore((state) => state.loading)
  const error = useUsageLogStore((state) => state.error)
  const fetchUsageLog = useUsageLogStore((state) => state.fetchUsageLog)
  const clearUsageLog = useUsageLogStore((state) => state.clearUsageLog)

  React.useEffect(() => {
    void fetchUsageLog()
  }, [fetchUsageLog])

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="flex-shrink-0 border-b border-punk-border/30 px-3 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-punk-accent" />
            <span className="font-punk-heading text-[13px] uppercase text-punk-text-primary">
              USAGE_LOG
            </span>
            <span className="font-punk-body text-[12px] text-punk-text-muted">
              {stats.total} EVENTS
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void clearUsageLog()}
            disabled={loading || events.length === 0}
            title="Clear usage log"
            aria-label="Clear usage log"
            className="gap-2"
          >
            <Trash2 className="h-3.5 w-3.5" />
            CLEAR
          </Button>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-2">
          {(Object.keys(ACTION_LABELS) as UsageLogAction[]).map((action) => (
            <StatTile key={action} action={action} count={stats.byAction[action]} />
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-3 mt-3 border border-punk-cta/50 bg-punk-cta/10 px-3 py-2 font-punk-body text-[12px] text-punk-cta">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {events.length === 0 ? (
          <div className="flex h-full min-h-[220px] items-center justify-center border border-dashed border-punk-border/50 bg-punk-bg-alt/30">
            <div className="text-center">
              <Activity className="mx-auto h-8 w-8 text-punk-text-muted" />
              <div className="mt-3 font-punk-heading text-sm text-punk-text-primary">
                NO_EVENTS_RECORDED
              </div>
            </div>
          </div>
        ) : (
          <ul className="space-y-2">
            {events.slice(0, 80).map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
