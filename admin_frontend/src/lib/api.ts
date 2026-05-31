import type {
  ThreadsResponse,
  InboxResponse,
  ReplyResponse,
  ToggleResponse,
} from "@/types/admin"

const ADMIN_API = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:8002"
const MAIN_API = process.env.NEXT_PUBLIC_MAIN_API_URL || "http://localhost:8000"

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init)
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${res.statusText}`)
  }
  return res.json() as Promise<T>
}

export function getThreads(): Promise<ThreadsResponse> {
  return request<ThreadsResponse>(`${ADMIN_API}/threads`)
}

export function getInbox(threadId: string): Promise<InboxResponse> {
  return request<InboxResponse>(`${ADMIN_API}/inbox/${threadId}`)
}

export function sendReply(
  threadId: string,
  sender: string,
  message: string
): Promise<ReplyResponse> {
  return request<ReplyResponse>(`${ADMIN_API}/reply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ thread_id: threadId, sender, message }),
  })
}

export function toggleMode(threadId: string): Promise<ToggleResponse> {
  return request<ToggleResponse>(`${ADMIN_API}/toggle/${threadId}`, {
    method: "POST",
  })
}

export function toggleCancel(threadId: string): Promise<unknown> {
  return request<unknown>(
    `${MAIN_API}/api/v1/chatbot/toggle-cancel/${threadId}`,
    { method: "POST" }
  )
}

export function buildAdminWsUrl(threadId: string): string {
  const wsBase = ADMIN_API.replace(/^http/, "ws")
  return `${wsBase}/ws/admin/${threadId}`
}
