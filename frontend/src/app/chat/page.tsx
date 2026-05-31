"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/store/authStore"
import { useChatStore } from "@/store/chatStore"
import {
  ChatHeader,
  MessageList,
  ChatInput,
  ConnectionBanner,
} from "@/components/chat"

export default function ChatPage() {
  const router = useRouter()
  const { user, isAuthenticated, isInitializing } = useAuthStore()
  const {
    messages,
    status,
    isTyping,
    connect,
    disconnect,
    sendMessage,
    reconnect,
  } = useChatStore()

  // Redirect if not authenticated
  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push("/login")
    }
  }, [isInitializing, isAuthenticated, router])

  // Connect on auth, disconnect on unmount
  useEffect(() => {
    if (isAuthenticated) {
      connect()
    }
    return () => disconnect()
  }, [isAuthenticated, connect, disconnect])

  // Escape key to disconnect
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") disconnect()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [disconnect])

  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-chat-bg">
        <p className="text-sm text-chat-muted">Loading...</p>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="flex h-screen flex-col bg-chat-bg">
      <ChatHeader user={user} status={status} onDisconnect={disconnect} />
      <MessageList messages={messages} isTyping={isTyping} />
      <ConnectionBanner status={status} onReconnect={reconnect} />
      <ChatInput
        onSend={sendMessage}
        disabled={status !== "connected"}
      />
    </div>
  )
}
