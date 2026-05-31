"use client"

import { motion } from "framer-motion"
import type { MessageEntry } from "@/types/admin"

function formatTime(timestamp: string): string {
  try {
    const date = new Date(timestamp.replace(" ", "T"))
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return timestamp
  }
}

export function MessageBubble({ message }: { message: MessageEntry }) {
  const { sender_type, sender, message: text, timestamp } = message

  if (sender_type === "user") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex justify-start"
      >
        <div className="max-w-[65%] rounded-2xl rounded-bl-sm bg-admin-user-msg px-4 py-2.5">
          <p className="mb-1 text-[0.68rem] font-semibold text-admin-accent2">
            💬 {sender}
          </p>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-admin-text">
            {text}
          </p>
          <p className="mt-1 text-right text-[0.65rem] text-admin-muted">
            {formatTime(timestamp)}
          </p>
        </div>
      </motion.div>
    )
  }

  if (sender_type === "admin") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
        className="flex justify-end"
      >
        <div className="max-w-[65%] rounded-2xl rounded-br-sm bg-admin-admin-msg px-4 py-2.5">
          <p className="mb-1 text-[0.68rem] font-semibold text-admin-accent">
            👤 You (Admin)
          </p>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-admin-text">
            {text}
          </p>
          <p className="mt-1 text-right text-[0.65rem] text-admin-muted">
            {formatTime(timestamp)}
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
      className="flex justify-start"
    >
      <div className="max-w-[65%] rounded-2xl rounded-bl-sm bg-admin-agent-msg px-4 py-2.5">
        <p className="mb-1 text-[0.68rem] font-semibold text-admin-accent2">
          🤖 Agent
        </p>
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-admin-text">
          {text}
        </p>
        <p className="mt-1 text-right text-[0.65rem] text-admin-muted">
          {formatTime(timestamp)}
        </p>
      </div>
    </motion.div>
  )
}
