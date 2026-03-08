"use client"

import Navbar from "../components/Navbar"
import SpotCard from "../components/SpotCard"
import ToiletBG from "../components/ToiletBG"
import { useState, useEffect } from "react"
import Avatar from "../components/UserAvatar"
import supabase from "@/supabaseClient"
import { useRouter } from "next/navigation"

interface ProfileRecord {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  twoFactorEnabled: boolean
}

interface ReviewRecord {
  id: string
  rating: number
  description: string
  created_at: string
  user: {
    username: string
  }
  bathroom: {
    id: string
    name: string
    building: string
    floor: number
    type: string
  }
}

export default function PoopersProfilePage() {
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState("top")
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)

  const filters = [
    { label: "Top", value: "top" },
    { label: "Friends", value: "friends" },
  ]

  useEffect(() => {
    let active = true

    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.access_token) {
        router.replace("/")
        return
      }

      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        return
      }

      const data = (await response.json()) as { user: ProfileRecord }

      if (!active) {
        return
      }

      setProfile(data.user)
    }

    void loadProfile()

    return () => {
      active = false
    }
  }, [router])

  useEffect(() => {
    let active = true

    const loadReviews = async () => {
      setIsLoadingReviews(true)

      const response = await fetch("/api/reviews")

      if (!response.ok) {
        if (active) {
          setIsLoadingReviews(false)
        }
        return
      }

      const data = (await response.json()) as { reviews: ReviewRecord[] }

      if (!active) {
        return
      }

      setReviews(data.reviews)
      setIsLoadingReviews(false)
    }

    void loadReviews()

    return () => {
      active = false
    }
  }, [])

  const profileReviews =
    profile
      ? reviews.filter((review) => review.user.username === profile.username)
      : []

  return (
    <main>
      <Navbar />

      <div className="grid grid-cols-1 md:grid-cols-3 min-h-screen">
        
        {/* Left 1/3 */}
        <aside className="md:col-span-1 bg-gray-100 p-6">
           <div className="flex flex-col items-center text-center space-y-2">
    
                {/* Avatar */}
                <Avatar size={220} />

                {/* Username */}
                <h2 className="text-2xl font-semibold mt-2">
                    {profile ? `${profile.firstName} ${profile.lastName}` : "Loading..."}
                </h2>

                {/* Handle */}
                <p className="text-gray-600 text-lg">
                    {profile ? `@${profile.username}` : ""}
                </p>

           
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-amber-900">
                Reviews
              </h3>

              {isLoadingReviews ? (
                <p className="text-gray-600">Loading reviews...</p>
              ) : profileReviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {profileReviews.map((review) => (
                    <div
                      key={review.id}
                      className="rounded-xl border border-amber-900 bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="font-semibold text-amber-900">
                            {review.bathroom.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {review.bathroom.building}, Floor {review.bathroom.floor}
                          </p>
                        </div>

                        <p className="font-semibold text-amber-900">
                          {review.rating}/5
                        </p>
                      </div>

                      {review.description ? (
                        <p className="mt-3 text-sm text-gray-700">
                          {review.description}
                        </p>
                      ) : (
                        <p className="mt-3 text-sm italic text-gray-400">
                          No written review.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
        </aside>

        {/* Right 2/3 */}
        <section className="md:col-span-2 p-6">
        
          {/* Filter Buttons */}
          <div className="flex gap-4 mb-6">
            {filters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setActiveFilter(filter.value)}
                className={`rounded-full px-4 py-1 w-1/2 border border-2 cursor-pointer cursor-hover:-y-0.5 transition-all duration-200
                  ${
                    activeFilter === filter.value
                      ? "bg-amber-900 text-white border-amber-900"
                      : "bg-white text-amber-900 border-amber-900 hover:bg-amber-100"
                  }
                `}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Users Content Area */}
          <div>
            <p className="text-gray-600">
              Currently viewing: <span className="font-semibold">{activeFilter}</span>
            </p>

            <div className="mt-6">
              <p className="text-gray-600">
                User cards will go here. When a user is clicked, their profile and reviews
                should replace the content in the left panel.
              </p>
            </div>
            
          </div>

        </section>

      </div>
    </main>
  )
}