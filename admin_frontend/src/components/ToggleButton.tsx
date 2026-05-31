"use client"

import { useState } from "react"
import { toggleMode, toggleCancel } from "@/lib/api"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function ToggleButton({
  threadId,
  isActive,
}: {
  threadId: string
  isActive: boolean
}) {
  const [loading, setLoading] = useState(false)

  const handleToggle = async () => {
    if (loading) return
    setLoading(true)

    try {
      const result = await toggleMode(threadId)

      if (!result.admin_active) {
        await toggleCancel(threadId).catch(() => {})
      }

      toast.success(result.message)
    } catch {
      toast.error("Failed to toggle mode")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border px-4 py-2 text-xs font-medium transition-all",
        isActive
          ? "border-admin-accent/50 bg-admin-accent/10 text-admin-accent"
          : "border-admin-border bg-admin-card text-admin-muted hover:text-admin-text"
      )}
    >
      <span
        className={cn(
          "h-2 w-2 rounded-full",
          isActive
            ? "bg-admin-accent animate-pulse-dot"
            : "bg-admin-muted"
        )}
      />
      {isActive ? "Admin Mode — ON" : "Agent Mode"}
    </button>
  )
}
