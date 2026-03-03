"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ListFilter } from "lucide-react"

export type DashboardFilter =
  | "all"
  | "near-me"
  | "top-rated"
  | "worst-rated"
  | "gender-neutral"
  | "accessible"

const FILTER_OPTIONS: Array<{ label: string; value: DashboardFilter }> = [
  { label: "All Spots", value: "all" },
  { label: "Near Me", value: "near-me" },
  { label: "Top Rated", value: "top-rated" },
  { label: "Worst Rated", value: "worst-rated" },
  { label: "Gender Neutral", value: "gender-neutral" },
  { label: "Accessible", value: "accessible" },
]

interface FilterDropdownProps {
  value: DashboardFilter
  onChange: (value: DashboardFilter) => void
}

export default function FilterDropdown({ value, onChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const activeOption =
    FILTER_OPTIONS.find((option) => option.value === value) ?? FILTER_OPTIONS[0]

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
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm text-amber-900 shadow transition hover:bg-rose-50 cursor-pointer"
      >
        <ListFilter size={18} />
        <span className="font-rubik">{activeOption.label}</span>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 z-50 mt-2 w-48 rounded-2xl border border-gray-100 bg-white p-2 shadow-lg"
          >
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm cursor-pointer ${
                  option.value === value
                    ? "bg-amber-100 text-amber-900"
                    : "hover:bg-gray-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
