"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ListFilter } from "lucide-react"


export default function FilterDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block" ref={ref}>
      {/* Button */}
      <button
        onClick={() => setOpen(!open)}
        className="px-4 py-2 text-amber-900 rounded-xl shadow hover:bg-rose-50 transition cursor-pointer"
      >
        <ListFilter size={18} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-lg border border-gray-100 p-2 z-50"
          >
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                Near Me
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                Top Rated
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                Worst Rated
            </button>
             <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                Gender Neutral
            </button>
            <button className="w-full text-left px-3 py-2 hover:bg-gray-100 rounded-lg cursor-pointer">
                Accessible
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}