"use client"

import { useRef, useCallback } from "react"
import { Send } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  onSend: (text: string) => void
  disabled: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const text = textarea.value.trim()
    if (!text) return

    onSend(text)
    textarea.value = ""
    textarea.style.height = "auto"
  }, [onSend])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
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
    const maxHeight = 130
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`
  }, [])

  return (
    <div className="flex items-end gap-2.5 border-t border-chat-border bg-chat-surface px-6 py-3">
      <textarea
        ref={textareaRef}
        placeholder={disabled ? "Reconnect to send messages..." : "Type a message..."}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        rows={1}
        className={cn(
          "flex-1 resize-none rounded-xl border border-chat-border bg-chat-card px-4 py-2.5 text-sm text-chat-text outline-none transition-colors",
          "placeholder:text-chat-muted focus:border-chat-accent focus:shadow-[0_0_0_3px_var(--chat-accent-glow)]",
          "min-h-[44px] max-h-[130px] leading-relaxed",
          disabled && "cursor-not-allowed opacity-50"
        )}
        aria-label="Type a message"
      />
      <button
        onClick={handleSend}
        disabled={disabled}
        className={cn(
          "flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-xl bg-chat-accent transition-all",
          "hover:bg-[#4f46e5] hover:shadow-[0_0_16px_var(--chat-accent-glow)] hover:scale-105",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none"
        )}
        aria-label="Send message"
      >
        <Send className="h-4 w-4 text-white" aria-hidden="true" />
      </button>
    </div>
  )
}
