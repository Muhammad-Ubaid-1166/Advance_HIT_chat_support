"use client"

import { useQuery } from "@tanstack/react-query"
import { getThreads, getInbox } from "@/lib/api"
import { useAdminStore } from "@/store/adminStore"
import { ThreadItem } from "@/components/ThreadItem"
import { Skeleton } from "@/components/ui/skeleton"
import { MessageSquare, LogOut } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import type { MessageEntry } from "@/types/admin"

export function Sidebar({
  onThreadSelect,
  isMobileOpen,
  onMobileClose,
}: {
  onThreadSelect: () => void
  isMobileOpen: boolean
  onMobileClose: () => void
}) {
  const logout = useAuthStore((s) => s.logout)
  const activeThreadId = useAdminStore((s) => s.activeThreadId)
  const unreadThreads = useAdminStore((s) => s.unreadThreads)

  const { data: threadsData, isLoading: threadsLoading } = useQuery({
    queryKey: ["threads"],
    queryFn: getThreads,
    refetchInterval: 4000,
  })

  const threadIds = threadsData?.threads?.filter(
    (id) => !id.includes("reply") && !id.includes("incoming")
  ) || []

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex w-[300px] flex-col border-r border-admin-border bg-admin-panel
          transition-transform duration-200 ease-in-out
          md:relative md:translate-x-0
          ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex items-center justify-between border-b border-admin-border px-5 py-4">
          <h2 className="font-[family-name:var(--font-heading)] text-lg font-bold text-admin-text">
            Admin Panel
          </h2>
          <button
            onClick={logout}
            className="rounded-lg p-2 text-admin-muted transition-colors hover:bg-admin-card hover:text-admin-text"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {threadsLoading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  className="h-[60px] w-full rounded-xl bg-admin-card"
                />
              ))}
            </div>
          )}

          {!threadsLoading && threadIds.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <MessageSquare className="h-10 w-10 text-admin-muted" />
              <p className="text-sm text-admin-muted">No conversations yet.</p>
            </div>
          )}

          {!threadsLoading && threadIds.length > 0 && (
            <ThreadList
              threadIds={threadIds}
              activeThreadId={activeThreadId}
              unreadThreads={unreadThreads}
              onSelect={(id) => {
                onThreadSelect()
                onMobileClose()
                useAdminStore.getState().setActiveThread(id)
              }}
            />
          )}
        </div>
      </aside>
    </>
  )
}

function ThreadList({
  threadIds,
  activeThreadId,
  unreadThreads,
  onSelect,
}: {
  threadIds: string[]
  activeThreadId: string | null
  unreadThreads: Set<string>
  onSelect: (id: string) => void
}) {
  return (
    <div className="space-y-1">
      {threadIds.map((id) => (
        <ThreadItemLoader
          key={id}
          threadId={id}
          isActive={id === activeThreadId}
          hasUnread={unreadThreads.has(id)}
          onSelect={() => onSelect(id)}
        />
      ))}
    </div>
  )
}

function ThreadItemLoader({
  threadId,
  isActive,
  hasUnread,
  onSelect,
}: {
  threadId: string
  isActive: boolean
  hasUnread: boolean
  onSelect: () => void
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["inbox", threadId],
    queryFn: () => getInbox(threadId),
    refetchInterval: 4000,
  })

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-xl p-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full bg-admin-card" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-24 bg-admin-card" />
          <Skeleton className="h-3 w-full bg-admin-card" />
        </div>
      </div>
    )
  }

  const messages: MessageEntry[] = data?.messages || []
  const lastUserMsg = [...messages]
    .reverse()
    .find((m) => m.sender_type === "user")

  const sender = lastUserMsg?.sender || threadId.slice(0, 8)
  const preview = lastUserMsg?.message || "No messages yet"
  const lastTimestamp = lastUserMsg?.timestamp || ""

  return (
    <ThreadItem
      threadId={threadId}
      sender={sender}
      preview={preview}
      lastTimestamp={lastTimestamp}
      isActive={isActive}
      hasUnread={hasUnread}
      onSelect={onSelect}
    />
  )
}
