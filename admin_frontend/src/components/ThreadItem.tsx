"use client"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

function getInitials(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase()
  return clean || "??"
}

export function ThreadItem({
  threadId,
  sender,
  preview,
  lastTimestamp,
  isActive,
  hasUnread,
  onSelect,
}: {
  threadId: string
  sender: string
  preview: string
  lastTimestamp: string
  isActive: boolean
  hasUnread: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-all",
        isActive
          ? "border-l-2 border-admin-accent bg-admin-card"
          : "border-l-2 border-transparent hover:bg-admin-card/50"
      )}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-admin-accent to-admin-accent2 text-xs font-bold text-[#0d0f14]">
        {getInitials(threadId)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm font-medium",
              hasUnread ? "text-admin-text" : "text-admin-text/80"
            )}
          >
            {sender}
          </span>
          {lastTimestamp && (
            <span className="shrink-0 text-[0.65rem] text-admin-muted">
              {formatShortTime(lastTimestamp)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <p
            className={cn(
              "truncate text-xs",
              hasUnread ? "text-admin-text" : "text-admin-muted"
            )}
          >
            {preview}
          </p>
          {hasUnread && (
            <Badge className="h-4 min-w-4 shrink-0 rounded-full bg-admin-accent px-1 text-[0.6rem] text-[#0d0f14]">
              !
            </Badge>
          )}
        </div>
      </div>
    </button>
  )
}

function formatShortTime(timestamp: string): string {
  try {
    const date = new Date(timestamp.replace(" ", "T"))
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMin = Math.floor(diffMs / 60000)

    if (diffMin < 1) return "now"
    if (diffMin < 60) return `${diffMin}m`

    const diffHr = Math.floor(diffMin / 60)
    if (diffHr < 24) return `${diffHr}h`

    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
  } catch {
    return ""
  }
}
