"use client"

import Link from "next/link"
import Rating from "../components/Rating"

interface SpotItem {
  id: string
  rating: number
  name: string
  detail: string
}

export default function SpotCard({ spot }: { spot: SpotItem }) {
  return (
    <Link
      href={`/bathroom/${spot.id}`}
      className="block rounded-xl border border-amber-900 bg-rose-50 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
    >
      <p className="font-rubik font-medium text-amber-900">
        {spot.name}
      </p>

      <div className=" flex items-center">
        <Rating value={spot.rating} />
      </div>

       <p className="mt-1 font-rubik text-sm text-gray-600">
        {spot.detail}
      </p>

    </Link>
  )
}