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

export default function SpotCard({ spot }: { spot: SpotItem }) {
  return (
    <Link
      href={`/bathroom/${spot.id}`}
      className="block rounded-xl border border-amber-900 bg-rose-50 p-4 shadow-sm transition hover:shadow-md"
    >
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

    </Link>
  )
}
