"use client"

import { useState } from "react"
import { useAuthStore } from "@/store/authStore"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, Eye, EyeOff } from "lucide-react"
import { toast } from "sonner"

export function LoginGate() {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const login = useAuthStore((s) => s.login)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      toast.error("Password is required")
      return
    }
    if (!login(password)) {
      toast.error("Invalid password")
      setPassword("")
    }
  }

  return (
    <div className="flex h-screen items-center justify-center bg-admin-bg">
      <div className="w-full max-w-sm rounded-2xl border border-admin-border bg-admin-panel p-8 shadow-2xl">
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-admin-card">
            <Lock className="h-6 w-6 text-admin-accent" />
          </div>
          <h1 className="font-[family-name:var(--font-heading)] text-xl font-bold text-admin-text">
            Admin Panel
          </h1>
          <p className="text-sm text-admin-muted">
            Enter the admin password to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="border-admin-border bg-admin-card text-admin-text placeholder:text-admin-muted focus:border-admin-accent"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-muted hover:text-admin-text"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <Button
            type="submit"
            className="w-full bg-admin-accent text-[#0d0f14] hover:bg-[#22c55e]"
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  )
}
