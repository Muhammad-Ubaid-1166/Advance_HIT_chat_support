"use client"

import { useState } from "react"
import { useAuthStore } from "@/store/authStore"
import { LoginGate } from "@/components/LoginGate"
import { Sidebar } from "@/components/Sidebar"
import { ChatArea } from "@/components/ChatArea"
import { Menu } from "lucide-react"

export default function DashboardPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!isAuthenticated) {
    return <LoginGate />
  }

  return (
    <div className="flex h-screen bg-admin-bg">
      <button
        onClick={() => setMobileMenuOpen(true)}
        className="fixed left-4 top-3 z-30 rounded-lg border border-admin-border bg-admin-panel p-2 text-admin-muted md:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Sidebar
        onThreadSelect={() => {}}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex flex-1 overflow-hidden">
        <ChatArea />
      </main>
    </div>
  )
}
