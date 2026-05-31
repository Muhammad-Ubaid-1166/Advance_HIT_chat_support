"use client"

import { create } from "zustand"
import type { User, DecodedToken } from "@/types/auth"
import {
  setTokenCookies,
  clearTokenCookies,
  getAccessToken,
} from "@/actions/auth"
import { setAccessToken } from "@/lib/axios"
import { logout as apiLogout } from "@/lib/api"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (accessToken: string, refreshToken: string) => Promise<void>
  logout: () => Promise<void>
  restoreSession: () => Promise<void>
}

function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]))
    return payload as DecodedToken
  } catch {
    return null
  }
}

function isTokenExpired(token: string): boolean {
  const decoded = decodeToken(token)
  if (!decoded) return true
  return decoded.exp * 1000 < Date.now()
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitializing: true,

  login: async (accessToken: string, refreshToken: string) => {
    await setTokenCookies(accessToken, refreshToken)
    setAccessToken(accessToken)

    const decoded = decodeToken(accessToken)
    if (decoded) {
      set({
        user: decoded.user,
        isAuthenticated: true,
      })
    }
  },

  logout: async () => {
    try {
      await apiLogout()
    } catch {
      // logout endpoint may fail — still clear local state
    }
    await clearTokenCookies()
    setAccessToken(null)
    set({
      user: null,
      isAuthenticated: false,
    })
  },

  restoreSession: async () => {
    try {
      const token = await getAccessToken()
      if (!token || isTokenExpired(token)) {
        set({ isInitializing: false })
        return
      }

      const decoded = decodeToken(token)
      if (decoded) {
        setAccessToken(token)
        set({
          user: decoded.user,
          isAuthenticated: true,
          isInitializing: false,
        })
      } else {
        set({ isInitializing: false })
      }
    } catch {
      set({ isInitializing: false })
    }
  },
}))
