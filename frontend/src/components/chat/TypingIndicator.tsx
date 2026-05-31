"use client"

import { motion, AnimatePresence } from "framer-motion"

interface TypingIndicatorProps {
  visible: boolean
}

export function TypingIndicator({ visible }: TypingIndicatorProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
          className="flex items-center gap-1.5 px-6 pb-2"
          role="status"
          aria-label="Agent is typing"
        >
          <span
            className="inline-block h-[7px] w-[7px] rounded-full bg-chat-muted"
            style={{ animation: "typing-bounce 1.2s infinite 0s" }}
          />
          <span
            className="inline-block h-[7px] w-[7px] rounded-full bg-chat-muted"
            style={{ animation: "typing-bounce 1.2s infinite 0.2s" }}
          />
          <span
            className="inline-block h-[7px] w-[7px] rounded-full bg-chat-muted"
            style={{ animation: "typing-bounce 1.2s infinite 0.4s" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
