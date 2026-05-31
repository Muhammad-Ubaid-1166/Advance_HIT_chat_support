"use client"

import { motion, AnimatePresence } from "framer-motion"
import type { WsConnectionStatus } from "@/types/chat"

interface ConnectionBannerProps {
  status: WsConnectionStatus
  onReconnect: () => void
}

export function ConnectionBanner({ status, onReconnect }: ConnectionBannerProps) {
  const show = status === "disconnected" || status === "error"

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-between border-t border-amber-700/30 bg-amber-900/30 px-6 py-2.5"
          role="alert"
        >
          <p className="text-sm text-amber-300">
            {status === "error"
              ? "Connection failed. Please try again."
              : "Connection lost."}
          </p>
          <button
            onClick={onReconnect}
            className="rounded-lg bg-amber-600/80 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-amber-500"
            aria-label="Reconnect to chat"
          >
            Reconnect
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
