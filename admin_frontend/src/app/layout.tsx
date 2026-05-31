import type { Metadata } from "next"
import { DM_Sans, JetBrains_Mono, Syne } from "next/font/google"
import "./globals.css"
import Providers from "./providers"

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
})

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Admin dashboard for managing user conversations",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${dmSans.variable} ${jetbrainsMono.variable} ${syne.variable}`}
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
