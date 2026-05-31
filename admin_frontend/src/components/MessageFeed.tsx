"use client"

import { useEffect, useRef } from "react"
import { useAdminStore } from "@/store/adminStore"
import { MessageBubble } from "@/components/MessageBubble"
import { Skeleton } from "@/components/ui/skeleton"

export function MessageFeed({ threadId }: { threadId: string }) {
  const messages = useAdminStore((s) => s.messages[threadId] || [])
  const scrollRef = useRef<HTMLDivElement>(null)
  const shouldAutoScroll = useRef(true)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const handleScroll = () => {
      const threshold = 100
      const atBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < threshold
      shouldAutoScroll.current = atBottom
    }

    el.addEventListener("scroll", handleScroll, { passive: true })
    return () => el.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (shouldAutoScroll.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    shouldAutoScroll.current = true
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [threadId])

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <Skeleton className="h-16 w-64 rounded-xl bg-admin-card" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4">
      <div className="space-y-3">
        {messages.map((msg, idx) => (
          <MessageBubble key={`${msg.timestamp}-${idx}`} message={msg} />
        ))}
      </div>
    </div>
  )
}
