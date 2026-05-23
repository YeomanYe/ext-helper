import * as React from "react"
import { Activity, Download, Power, PowerOff, Puzzle, Trash2 } from "lucide-react"
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
  uninstalled: Trash2,
}

const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp)
  const pad = (value: number) => value.toString().padStart(2, "0")

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}

const getExtensionInitial = (event: UsageLogEvent): string =>
  (event.extensionName || event.extensionId || "?").trim().charAt(0).toUpperCase()

function StatTile({ action, count }: { action: UsageLogAction; count: number }) {
  const Icon = ACTION_ICONS[action]

  return (
    <div className="border border-punk-border/40 bg-punk-surface-raised px-3 py-2 shadow-punk-hard">
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

function EventIcon({ event }: { event: UsageLogEvent }) {
  const [imageFailed, setImageFailed] = React.useState(false)
  const Icon = ACTION_ICONS[event.action]
  const showImage = Boolean(event.iconUrl) && !imageFailed
  const isPositive = event.action === "enabled" || event.action === "installed"

  React.useEffect(() => {
    setImageFailed(false)
  }, [event.iconUrl])

  return (
    <div className="relative mt-0.5 h-10 w-10 flex-shrink-0">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden border border-punk-border/50 bg-punk-surface-soft font-punk-heading text-sm text-punk-text-primary">
        {showImage ? (
          <img
            src={event.iconUrl ?? undefined}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : getExtensionInitial(event) ? (
          <span>{getExtensionInitial(event)}</span>
        ) : (
          <Puzzle className="h-4 w-4 text-punk-text-muted" />
        )}
      </div>
      <div
        className={cn(
          "absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center border-2 border-punk-bg-alt",
          isPositive
            ? "border-punk-bg-alt bg-punk-success text-punk-bg"
            : "border-punk-bg-alt bg-punk-cta text-punk-bg"
        )}
        title={ACTION_LABELS[event.action]}
        aria-label={ACTION_LABELS[event.action]}
      >
        <Icon className="h-3 w-3" />
      </div>
    </div>
  )
}

function EventRow({ event }: { event: UsageLogEvent }) {
  return (
    <li className="border border-punk-border/30 bg-punk-surface-raised px-3 py-2">
      <div className="flex items-start gap-3">
        <EventIcon event={event} />
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
          <div className="flex h-full min-h-[220px] items-center justify-center border border-dashed border-punk-border/50 bg-punk-surface-soft/70">
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
