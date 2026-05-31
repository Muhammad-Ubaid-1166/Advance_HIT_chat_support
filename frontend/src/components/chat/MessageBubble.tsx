"use client"

import { motion } from "framer-motion"
import { AlertTriangle, User, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChatMessage } from "@/types/chat"

interface MessageBubbleProps {
  message: ChatMessage
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })
}

function SenderIcon({ sender }: { sender: "admin" | "agent" }) {
  if (sender === "admin") {
    return <User className="h-3 w-3" aria-hidden="true" />
  }
  return <Bot className="h-3 w-3" aria-hidden="true" />
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { type, sender, content, timestamp, queued } = message

  // Status messages
  if (type === "status") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-center"
        role="status"
        aria-live="polite"
      >
        <div className="rounded-full border border-dashed border-chat-border bg-transparent px-4 py-1 text-xs text-chat-muted">
          {content}
        </div>
      </motion.div>
    )
  }

  // Error messages
  if (type === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex justify-center"
        role="alert"
      >
        <div className="flex items-center gap-2 rounded-full border border-dashed border-red-500/30 bg-red-500/10 px-4 py-1 text-xs text-red-400">
          <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{content}</span>
        </div>
      </motion.div>
    )
  }

  // User message
  if (sender === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex justify-end"
      >
        <div className="max-w-[62%] rounded-2xl rounded-br-sm bg-chat-accent px-4 py-2.5 text-sm text-white">
          <p className="whitespace-pre-wrap break-words leading-relaxed">
            {content}
          </p>
          <div className="mt-1 flex items-center justify-end gap-2">
            {queued && (
              <span className="text-[0.65rem] italic text-white/50">
                queued
              </span>
            )}
            <span className="text-[0.65rem] text-white/50">
              {formatTime(timestamp)}
            </span>
          </div>
        </div>
      </motion.div>
    )
  }

  // Admin or Agent message
  const isAdmin = sender === "admin"
  const label = isAdmin ? "Admin" : "Agent"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
      className="flex justify-start"
    >
      <div
        className={cn(
          "max-w-[62%] rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm",
          isAdmin
            ? "border border-chat-border bg-chat-card text-chat-text"
            : "border border-teal-800/40 bg-chat-agent-msg text-chat-text"
        )}
      >
        {/* Sender label */}
        <div
          className={cn(
            "mb-1 flex items-center gap-1.5 text-[0.68rem] font-semibold uppercase tracking-wide opacity-65",
            isAdmin ? "text-chat-accent" : "text-chat-green"
          )}
        >
          <SenderIcon sender={sender!} />
          <span>{label}</span>
        </div>

        <p className="whitespace-pre-wrap break-words leading-relaxed">
          {content}
        </p>

        <div className="mt-1 text-right text-[0.65rem] text-chat-muted opacity-70">
          {formatTime(timestamp)}
        </div>
      </div>
    </motion.div>
  )
}
