export interface MessageEntry {
  sender: string
  sender_type: "user" | "admin" | "agent"
  message: string
  timestamp: string
}

export interface ThreadsResponse {
  threads: string[]
}

export interface InboxResponse {
  thread_id: string
  total_messages: number
  messages: MessageEntry[]
}

export interface ReplyResponse {
  status: string
  thread_id: string
  data: MessageEntry
}

export interface ToggleResponse {
  thread_id: string
  admin_active: boolean
  message: string
}

export interface WsHistory {
  type: "history"
  messages: MessageEntry[]
  admin_active: boolean
}

export interface WsNewMessage {
  type: "new_message"
  message: MessageEntry
}

export interface WsToggleChange {
  type: "toggle_change"
  admin_active: boolean
}

export type WsMessage = WsHistory | WsNewMessage | WsToggleChange

export type WsConnectionStatus = "idle" | "connecting" | "connected" | "disconnected" | "error"
