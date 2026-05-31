"use client"

import { useAdminStore } from "@/store/adminStore"
import { ToggleButton } from "@/components/ToggleButton"

function getInitials(id: string): string {
  const clean = id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 2).toUpperCase()
  return clean || "??"
}

export function ChatHeader({ threadId }: { threadId: string }) {
  const adminActive = useAdminStore((s) => s.adminActive[threadId] ?? false)

  return (
    <div className="flex items-center justify-between border-b border-admin-border bg-admin-panel px-5 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-admin-accent to-admin-accent2 text-sm font-bold text-[#0d0f14]">
          {getInitials(threadId)}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-admin-text">
            User {threadId.slice(0, 8)}
          </h3>
          <p className="font-mono text-xs text-admin-muted">{threadId}</p>
        </div>
      </div>

      <ToggleButton threadId={threadId} isActive={adminActive} />
    </div>
  )
}
