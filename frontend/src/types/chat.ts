export type WsMessageType = "message" | "status" | "error"
export type WsConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "error"
export type SenderType = "admin" | "agent" | "user"

export interface WsIncomingMessage {
  type: WsMessageType
  sender?: "admin" | "agent"
  message: string
}

export interface ChatMessage {
  id: string
  type: WsMessageType
  sender?: SenderType
  content: string
  timestamp: number
  queued?: boolean
}

export interface QueuedMessage {
  id: string
  text: string
  timestamp: number
}

export interface ChatStore {
  messages: ChatMessage[]
  status: WsConnectionStatus
  isTyping: boolean
  threadId: string
  queuedMessages: QueuedMessage[]
  reconnectAttempts: number

  connect: () => void
  disconnect: () => void
  sendMessage: (text: string) => void
  reconnect: () => void
  reset: () => void

  // Internal actions (used by the store itself)
  _handleMessage: (data: WsIncomingMessage) => void
  _handleClose: () => void
}
