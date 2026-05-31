"use client"

import { create } from "zustand"

interface AuthState {
  isAuthenticated: boolean
  login: (password: string) => boolean
  logout: () => void
}

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || ""

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: (() => {
    if (typeof window === "undefined") return false
    return sessionStorage.getItem("admin_auth") === "true"
  })(),

  login: (password: string) => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem("admin_auth", "true")
      set({ isAuthenticated: true })
      return true
    }
    return false
  },

  logout: () => {
    sessionStorage.removeItem("admin_auth")
    set({ isAuthenticated: false })
  },
}))
