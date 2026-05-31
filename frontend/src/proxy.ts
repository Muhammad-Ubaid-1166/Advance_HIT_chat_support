import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const protectedRoutes = ["/chat", "/dashboard"]
const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"]

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get("access_token")?.value

  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )
  const isAuthRoute = authRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  )

  if (isProtectedRoute && !accessToken) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (isAuthRoute && accessToken) {
    return NextResponse.redirect(new URL("/chat", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/chat/:path*", "/dashboard/:path*", "/login", "/signup", "/forgot-password", "/reset-password", "/verify-email"],
}
