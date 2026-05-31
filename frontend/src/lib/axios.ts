import axios from "axios"
import { setTokenCookies, clearTokenCookies } from "@/actions/auth"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

let accessToken: string | null = null
let isRefreshing = false
let failedQueue: {
  resolve: (token: string) => void
  reject: (error: unknown) => void
}[] = []

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessTokenValue(): string | null {
  return accessToken
}

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error || !token) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
        .catch((err) => Promise.reject(err))
    }

    originalRequest._retry = true
    isRefreshing = true

    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/refresh_token`,
        {
          withCredentials: true,
          headers: {
            Cookie: `refresh_token=${getRefreshTokenFromCookie()}`,
          },
        }
      )

      const newAccessToken = response.data.access_token
      accessToken = newAccessToken
      await setTokenCookies(newAccessToken, getRefreshTokenFromCookie() || "")

      processQueue(null, newAccessToken)

      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
      return api(originalRequest)
    } catch (refreshError) {
      processQueue(refreshError, null)
      accessToken = null
      await clearTokenCookies()

      if (typeof window !== "undefined") {
        window.location.href = "/login"
      }

      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
    }
  }
)

function getRefreshTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null
  const match = document.cookie.match(/refresh_token=([^;]+)/)
  return match ? match[1] : null
}

export default api
