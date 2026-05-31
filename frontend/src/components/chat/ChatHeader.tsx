"use client"

import { LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { User } from "@/types/auth"
import type { WsConnectionStatus } from "@/types/chat"

interface ChatHeaderProps {
  user: User | null
  status: WsConnectionStatus
  onDisconnect: () => void
}

function getStatusLabel(status: WsConnectionStatus): string {
  switch (status) {
    case "connected":
      return "Connected"
    case "connecting":
      return "Connecting..."
    case "disconnected":
      return "Disconnected"
    case "error":
      return "Connection error"
    default:
      return "Offline"
  }
}

function isOnline(status: WsConnectionStatus): boolean {
  return status === "connected" || status === "connecting"
}

export function ChatHeader({ user, status, onDisconnect }: ChatHeaderProps) {
  const email = user?.email || "User"
  const initials = email.slice(0, 2).toUpperCase()

  return (
    <header className="flex items-center gap-3.5 border-b border-chat-border bg-chat-surface px-6 py-3">
      {/* Avatar */}
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6]"
        aria-hidden="true"
      >
        <span className="font-sans text-xs font-bold text-white">
          {initials}
        </span>
      </div>

      {/* User info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-chat-text">
          {email}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          <span
            className={cn(
              "inline-block h-[7px] w-[7px] rounded-full",
              isOnline(status) ? "bg-chat-green" : "bg-chat-muted"
            )}
            style={{
              animation: isOnline(status)
                ? "pulse-dot 2s infinite"
                : undefined,
            }}
            aria-hidden="true"
          />
          <span
            className={cn(
              "text-xs",
              isOnline(status) ? "text-chat-green" : "text-chat-muted"
            )}
          >
            {getStatusLabel(status)}
          </span>
        </div>
      </div>

      {/* Disconnect button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onDisconnect}
        className="gap-1.5 text-chat-muted hover:border hover:border-red-500/40 hover:text-red-400"
        aria-label="Disconnect from chat"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Disconnect</span>
      </Button>
    </header>
  )
}
