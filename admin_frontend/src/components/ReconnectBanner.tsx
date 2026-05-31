"use client"

import { AlertTriangle } from "lucide-react"
import { reconnectAdminWs } from "@/store/adminStore"

export function ReconnectBanner({ threadId }: { threadId: string }) {
  return (
    <div className="flex items-center justify-center gap-2 bg-admin-danger/10 px-4 py-2 text-xs text-admin-danger">
      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
      <span>Connection lost.</span>
      <button
        onClick={() => reconnectAdminWs(threadId)}
        className="font-medium underline underline-offset-2 hover:text-admin-text"
      >
        Reconnect
      </button>
    </div>
  )
}
