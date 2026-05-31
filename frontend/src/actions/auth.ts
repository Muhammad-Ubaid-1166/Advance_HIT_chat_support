"use server"

import { cookies } from "next/headers"

const ACCESS_TOKEN_MAX_AGE = 3600
const REFRESH_TOKEN_MAX_AGE = 172800

function getCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  }
}

export async function setTokenCookies(
  accessToken: string,
  refreshToken: string
) {
  const cookieStore = await cookies()
  cookieStore.set("access_token", accessToken, getCookieOptions(ACCESS_TOKEN_MAX_AGE))
  cookieStore.set("refresh_token", refreshToken, getCookieOptions(REFRESH_TOKEN_MAX_AGE))
}

export async function clearTokenCookies() {
  const cookieStore = await cookies()
  cookieStore.delete("access_token")
  cookieStore.delete("refresh_token")
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("access_token")
  return token?.value ?? null
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get("refresh_token")
  return token?.value ?? null
}
