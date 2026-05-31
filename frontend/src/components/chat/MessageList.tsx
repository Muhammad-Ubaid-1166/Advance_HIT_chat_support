"use client"

import { useEffect, useRef } from "react"
import { AnimatePresence } from "framer-motion"
import { MessageBubble } from "./MessageBubble"
import { TypingIndicator } from "./TypingIndicator"
import type { ChatMessage } from "@/types/chat"

interface MessageListProps {
  messages: ChatMessage[]
  isTyping: boolean
}

export function MessageList({ messages, isTyping }: MessageListProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  return (
    <div
      ref={containerRef}
      className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4"
      style={{
        backgroundImage:
          "radial-gradient(circle at 20% 80%, rgba(26,29,58,0.13) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(15,32,39,0.13) 0%, transparent 50%)",
      }}
    >
      {messages.length === 0 && (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-chat-muted">
            Start a conversation...
          </p>
        </div>
      )}

      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
      </AnimatePresence>

      <TypingIndicator visible={isTyping} />

      <div ref={bottomRef} />
    </div>
  )
}
