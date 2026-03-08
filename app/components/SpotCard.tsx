"use client"

import Link from "next/link"
import Rating from "../components/Rating"

interface SpotItem {
  id: string
  rating: number
  name: string
  detail: string
  reviewCount: number
  isOpen: boolean
  typeLabel: string
}

interface SpotCardProps {
  spot: SpotItem
  href?: string
  onClick?: () => void
  isSelected?: boolean
}

function SpotCardBody({ spot }: { spot: SpotItem }) {
  return (
    <>
      <p className="font-rubik font-medium text-amber-900">
        {spot.name}
      </p>

      <div className="mt-2 flex items-center gap-3">
        <Rating value={spot.rating} />
        <span className="font-rubik text-sm text-gray-600">
          {spot.rating.toFixed(1)} ({spot.reviewCount})
        </span>
      </div>

      <p className="mt-1 font-rubik text-sm text-gray-600">
        {spot.detail}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className="rounded-full bg-amber-100 px-2 py-1 font-rubik text-xs text-amber-900">
          {spot.typeLabel}
        </span>
        <span
          className={`rounded-full px-2 py-1 font-rubik text-xs ${
            spot.isOpen
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {spot.isOpen ? "Open" : "Closed"}
        </span>
      </div>
    </>
  )
}

export default function SpotCard({
  spot,
  href,
  onClick,
  isSelected = false,
}: SpotCardProps) {
  const className = `block w-full rounded-xl border border-amber-900 p-4 text-left shadow-sm transition hover:shadow-md ${
    isSelected ? "bg-amber-50 shadow-md" : "bg-rose-50"
  }`

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isSelected}
        className={className}
      >
        <SpotCardBody spot={spot} />
      </button>
    )
  }

  return (
    <Link
      href={href ?? `/bathroom/${spot.id}`}
      className={className}
    >
      <SpotCardBody spot={spot} />
    </Link>
  )
}
