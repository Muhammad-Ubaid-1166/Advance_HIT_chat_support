"use client"

import { create } from "zustand"
import type { MessageEntry, WsConnectionStatus } from "@/types/admin"
import { buildAdminWsUrl } from "@/lib/api"

interface AdminState {
  activeThreadId: string | null
  messages: Record<string, MessageEntry[]>
  adminActive: Record<string, boolean>
  unreadThreads: Set<string>
  wsStatus: WsConnectionStatus

  setActiveThread: (id: string | null) => void
  setMessages: (threadId: string, messages: MessageEntry[]) => void
  appendMessage: (threadId: string, message: MessageEntry) => void
  setAdminActive: (threadId: string, active: boolean) => void
  markRead: (threadId: string) => void
  addUnread: (threadId: string) => void
  setWsStatus: (status: WsConnectionStatus) => void
}

let wsInstance: WebSocket | null = null

export const useAdminStore = create<AdminState>((set) => ({
  activeThreadId: null,
  messages: {},
  adminActive: {},
  unreadThreads: new Set<string>(),
  wsStatus: "idle",

  setActiveThread: (id: string | null) => {
    if (wsInstance) {
      wsInstance.close(1000)
      wsInstance = null
    }
    set({ activeThreadId: id, wsStatus: "idle" })

    if (id) {
      set((state) => {
        const newUnread = new Set(state.unreadThreads)
        newUnread.delete(id)
        return { unreadThreads: newUnread }
      })
    }
  },

  setMessages: (threadId, messages) =>
    set((state) => ({
      messages: { ...state.messages, [threadId]: messages },
    })),

  appendMessage: (threadId, message) =>
    set((state) => {
      const existing = state.messages[threadId] || []
      const duplicate = existing.some(
        (m) =>
          m.sender === message.sender &&
          m.message === message.message &&
          m.timestamp === message.timestamp
      )
      if (duplicate) return state
      return {
        messages: { ...state.messages, [threadId]: [...existing, message] },
      }
    }),

  setAdminActive: (threadId, active) =>
    set((state) => ({
      adminActive: { ...state.adminActive, [threadId]: active },
    })),

  markRead: (threadId) =>
    set((state) => {
      const newUnread = new Set(state.unreadThreads)
      newUnread.delete(threadId)
      return { unreadThreads: newUnread }
    }),

  addUnread: (threadId) =>
    set((state) => {
      if (state.activeThreadId === threadId) return state
      const newUnread = new Set(state.unreadThreads)
      newUnread.add(threadId)
      return { unreadThreads: newUnread }
    }),

  setWsStatus: (status) => set({ wsStatus: status }),
}))

let reconnectTimer: ReturnType<typeof setTimeout> | null = null

export function connectAdminWs(threadId: string) {
  const store = useAdminStore.getState()

  if (wsInstance) {
    wsInstance.close(1000)
    wsInstance = null
  }

  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  store.setWsStatus("connecting")

  try {
    const ws = new WebSocket(buildAdminWsUrl(threadId))
    wsInstance = ws

    ws.onopen = () => {
      if (wsInstance !== ws) return
      store.setWsStatus("connected")
    }

    ws.onmessage = (event: MessageEvent) => {
      if (wsInstance !== ws) return

      try {
        const data = JSON.parse(event.data) as import("@/types/admin").WsMessage
        const currentState = useAdminStore.getState()

        if (data.type === "history") {
          currentState.setMessages(threadId, data.messages)
          currentState.setAdminActive(threadId, data.admin_active)
        } else if (data.type === "new_message") {
          currentState.appendMessage(threadId, data.message)
          currentState.addUnread(threadId)
        } else if (data.type === "toggle_change") {
          currentState.setAdminActive(threadId, data.admin_active)
        }
      } catch {
        // Ignore malformed messages
      }
    }

    ws.onclose = () => {
      if (wsInstance !== ws) return
      store.setWsStatus("disconnected")
    }

    ws.onerror = () => {
      if (wsInstance !== ws) return
      store.setWsStatus("error")
    }
  } catch {
    store.setWsStatus("error")
  }
}

export function disconnectAdminWs() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (wsInstance) {
    wsInstance.close(1000)
    wsInstance = null
  }
  useAdminStore.getState().setWsStatus("idle")
}

export function reconnectAdminWs(threadId: string) {
  disconnectAdminWs()
  setTimeout(() => connectAdminWs(threadId), 100)
}
