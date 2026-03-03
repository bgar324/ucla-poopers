"use client"

import { ReactNode } from "react"
import { motion } from "framer-motion"

export default function Template({ children }: { children: ReactNode }) {
  return (
<motion.main
  initial={{ opacity: 0, scale: 0.98 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{
    duration: 0.35,
    ease: [0.4, 0, 0.2, 1],
  }}
  className="min-h-[calc(100vh-80px)]"
>
      {children}
    </motion.main>
  )
}