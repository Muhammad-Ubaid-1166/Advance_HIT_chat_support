"use client"

import { useState, useRef, useCallback } from "react"
import { Send } from "lucide-react"
import { sendReply } from "@/lib/api"
import { useAdminStore } from "@/store/adminStore"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function ReplyComposer({ threadId }: { threadId: string }) {
  const [message, setMessage] = useState("")
  const [sender, setSender] = useState("admin")
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(async () => {
    const text = message.trim()
    if (!text || sending) return

    const tempMsg = {
      sender: sender || "admin",
      sender_type: "admin" as const,
      message: text,
      timestamp: new Date().toISOString().replace("T", " ").slice(0, 19),
    }

    useAdminStore.getState().appendMessage(threadId, tempMsg)

    setMessage("")
    setSending(true)

    try {
      await sendReply(threadId, sender || "admin", text)
    } catch {
      toast.error("Failed to send reply")
    } finally {
      setSending(false)
      textareaRef.current?.focus()
    }
  }, [message, sender, threadId, sending])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey) {
        e.preventDefault()
        handleSend()
      }
      if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault()
        handleSend()
      }
    },
    [handleSend]
  )

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = "auto"
    const maxHeight = 120
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }, [])

  return (
    <div className="flex items-end gap-2 border-t border-admin-border bg-admin-panel px-5 py-3">
      <input
        type="text"
        value={sender}
        onChange={(e) => setSender(e.target.value)}
        className="w-[130px] shrink-0 rounded-lg border border-admin-border bg-admin-card px-3 py-2 text-xs text-admin-text outline-none transition-colors placeholder:text-admin-muted focus:border-admin-accent"
        placeholder="Sender name"
      />

      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        rows={1}
        placeholder="Type a message..."
        disabled={sending}
        className={cn(
          "flex-1 resize-none rounded-lg border border-admin-border bg-admin-card px-4 py-2.5 text-sm text-admin-text outline-none transition-colors",
          "placeholder:text-admin-muted focus:border-admin-accent",
          "min-h-[42px] max-h-[120px] leading-relaxed",
          sending && "cursor-not-allowed opacity-50"
        )}
      />

      <button
        onClick={handleSend}
        disabled={sending || !message.trim()}
        className={cn(
          "flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-lg bg-admin-accent transition-all",
          "hover:bg-[#22c55e] hover:shadow-[0_0_16px_rgba(74,222,128,0.3)] hover:scale-105",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
        )}
        title="Send (Enter / Ctrl+Enter)"
      >
        <Send className="h-4 w-4 text-[#0d0f14]" />
      </button>
    </div>
  )
}
