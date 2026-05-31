"use client"

import { useEffect, useRef } from "react"
import { useAdminStore, connectAdminWs, disconnectAdminWs } from "@/store/adminStore"
import { ChatHeader } from "@/components/ChatHeader"
import { MessageFeed } from "@/components/MessageFeed"
import { ReplyComposer } from "@/components/ReplyComposer"
import { ReconnectBanner } from "@/components/ReconnectBanner"
import { MessageSquare } from "lucide-react"

export function ChatArea() {
  const activeThreadId = useAdminStore((s) => s.activeThreadId)
  const wsStatus = useAdminStore((s) => s.wsStatus)
  const prevThreadRef = useRef<string | null>(null)

  useEffect(() => {
    if (activeThreadId && activeThreadId !== prevThreadRef.current) {
      disconnectAdminWs()
      connectAdminWs(activeThreadId)
      prevThreadRef.current = activeThreadId
    }

    if (!activeThreadId) {
      disconnectAdminWs()
      prevThreadRef.current = null
    }
  }, [activeThreadId])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        useAdminStore.getState().setActiveThread(null)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  if (!activeThreadId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-admin-bg">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-admin-border bg-admin-panel">
            <MessageSquare className="h-8 w-8 text-admin-muted" />
          </div>
          <div>
            <p className="text-lg font-medium text-admin-text">
              Select a conversation to start replying.
            </p>
            <p className="mt-1 text-sm text-admin-muted">
              Choose a thread from the sidebar to view messages and respond.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col bg-admin-bg">
      <ChatHeader threadId={activeThreadId} />
      {wsStatus === "disconnected" && (
        <ReconnectBanner threadId={activeThreadId} />
      )}
      <MessageFeed threadId={activeThreadId} />
      <ReplyComposer threadId={activeThreadId} />
    </div>
  )
}
