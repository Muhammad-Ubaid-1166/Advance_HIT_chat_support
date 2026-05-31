"use client"

import { create } from "zustand"
import type {
  ChatStore,
  ChatMessage,
  WsIncomingMessage,
  QueuedMessage,
} from "@/types/chat"
import { getAccessTokenValue } from "@/lib/axios"

const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000]
const MAX_RECONNECT_ATTEMPTS = RECONNECT_DELAYS.length

let wsInstance: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null

function generateThreadId(): string {
  return crypto.randomUUID()
}

function buildWsUrl(token: string): string {
  return `${WS_BASE_URL}/api/v1/chatbot/ws?token=${token}`
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  status: "idle",
  isTyping: false,
  threadId: generateThreadId(),
  queuedMessages: [],
  reconnectAttempts: 0,

  connect: () => {
    const { status } = get()
    if (status === "connecting" || status === "connected") return

    const token = getAccessTokenValue()
    if (!token) {
      set({ status: "error" })
      return
    }

    set({ status: "connecting" })

    try {
      const ws = new WebSocket(buildWsUrl(token))
      wsInstance = ws

      ws.onopen = () => {
        if (wsInstance !== ws) return
        set({
          status: "connected",
          reconnectAttempts: 0,
        })
      }

      ws.onmessage = (event: MessageEvent) => {
        if (wsInstance !== ws) return

        try {
          const data: WsIncomingMessage = JSON.parse(event.data)
          get()._handleMessage(data)
        } catch {
          // Ignore malformed messages
        }
      }

      ws.onclose = (event: CloseEvent) => {
        if (wsInstance !== ws) return

        if (event.code === 1008) {
          set({ status: "error" })
          if (typeof window !== "undefined") {
            window.location.href = "/login"
          }
          return
        }

        if (event.code === 1000) {
          set({ status: "disconnected" })
          return
        }

        get()._handleClose()
      }

      ws.onerror = () => {
        if (wsInstance !== ws) return
        set({ status: "error" })
      }
    } catch {
      set({ status: "error" })
    }
  },

  disconnect: () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    if (wsInstance) {
      wsInstance.close(1000)
      wsInstance = null
    }

    set({
      status: "disconnected",
      isTyping: false,
      reconnectAttempts: 0,
    })
  },

  sendMessage: (text: string) => {
    const { status } = get()
    const trimmed = text.trim()
    if (!trimmed) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      type: "message",
      sender: "user",
      content: trimmed,
      timestamp: Date.now(),
    }

    if (status === "connected" && wsInstance?.readyState === WebSocket.OPEN) {
      wsInstance.send(trimmed)
      set((state) => ({
        messages: [...state.messages, userMessage],
      }))
    } else {
      const queued: QueuedMessage = {
        id: userMessage.id,
        text: trimmed,
        timestamp: userMessage.timestamp,
      }
      set((state) => ({
        messages: [...state.messages, { ...userMessage, queued: true }],
        queuedMessages: [...state.queuedMessages, queued],
      }))
    }
  },

  reconnect: () => {
    get().disconnect()
    set({ status: "idle", reconnectAttempts: 0 })
    setTimeout(() => get().connect(), 100)
  },

  reset: () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (wsInstance) {
      wsInstance.close(1000)
      wsInstance = null
    }
    set({
      messages: [],
      status: "idle",
      isTyping: false,
      threadId: generateThreadId(),
      queuedMessages: [],
      reconnectAttempts: 0,
    })
  },

  _handleMessage: (data: WsIncomingMessage) => {
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      type: data.type,
      sender: data.sender,
      content: data.message,
      timestamp: Date.now(),
    }

    const isThinking =
      data.type === "status" &&
      (data.message.includes("thinking") ||
        data.message.includes("Waiting") ||
        data.message.includes("thinking"))

    set((state) => ({
      messages: [...state.messages, message],
      isTyping: isThinking,
      // Any incoming message that isn't a thinking status clears typing
      ...(data.type !== "status" || !isThinking ? { isTyping: false } : {}),
    }))
  },

  _handleClose: () => {
    const { reconnectAttempts } = get()

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      set({ status: "error" })
      return
    }

    const delay = RECONNECT_DELAYS[reconnectAttempts]
    set({ reconnectAttempts: reconnectAttempts + 1 })

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      get().connect()
    }, delay)
  },
}))
