"use client"

import Navbar from "../components/Navbar"
import ToiletBG from "../components/ToiletBG"
import { useState, useEffect } from "react"
import Avatar from "../components/UserAvatar"
import UserCard from "../components/UserCard"
import supabase from "@/supabaseClient"
import { useRouter } from "next/navigation"

interface ProfileRecord {
  id: string
  email: string
  username: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  twoFactorEnabled: boolean
}

interface UserRecord {
  id: string
  username: string
  firstName: string
  lastName: string
  avatarUrl: string | null
  reviewCount: number
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
  const [searchQuery, setSearchQuery] = useState("")
  const [profile, setProfile] = useState<ProfileRecord | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null)
  const [reviews, setReviews] = useState<ReviewRecord[]>([])
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)

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

  useEffect(() => {
    let active = true

    const loadUsers = async () => {
      setIsLoadingUsers(true)

      const response = await fetch("/api/users")

      if (!response.ok) {
        if (active) {
          setIsLoadingUsers(false)
        }
        return
      }

      const data = (await response.json()) as { users: UserRecord[] }

      if (!active) {
        return
      }

      setUsers(data.users)
      setIsLoadingUsers(false)
    }

    void loadUsers()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!profile || users.length === 0 || selectedUser) {
      return
    }

    const matchingUser = users.find((user) => user.username === profile.username)

    if (matchingUser) {
      setSelectedUser(matchingUser)
      return
    }

    setSelectedUser({
      id: profile.id,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      reviewCount: reviews.filter((review) => review.user.username === profile.username).length,
    })
  }, [profile, users, selectedUser, reviews])

  const displayedUser =
    selectedUser ??
    (profile
      ? {
          id: profile.id,
          username: profile.username,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl: profile.avatarUrl,
          reviewCount: reviews.filter((review) => review.user.username === profile.username).length,
        }
      : null)

  const displayedUserReviews =
    displayedUser
      ? reviews.filter((review) => review.user.username === displayedUser.username)
      : []

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const topUsers = users.filter((user) => {
    if (!normalizedQuery) {
      return true
    }

    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase()

    return (
      fullName.includes(normalizedQuery) ||
      user.firstName.toLowerCase().includes(normalizedQuery) ||
      user.lastName.toLowerCase().includes(normalizedQuery) ||
      user.username.toLowerCase().includes(normalizedQuery)
    )
  })

  return (
    <main className="h-screen overflow-hidden">
      <Navbar />

      <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-80px)]">
        
        {/* Left 1/3 */}
        <aside className="md:col-span-1 bg-gray-100 p-6 overflow-y-auto">
           <div className="flex flex-col items-center text-center space-y-2">
    
                {/* Avatar */}
                <Avatar
                  size={220}
                  src={displayedUser?.avatarUrl ?? undefined}
                />

                {/* Username */}
                <h2 className="text-2xl font-semibold mt-2">
                    {displayedUser ? `${displayedUser.firstName} ${displayedUser.lastName}` : "Loading..."}
                </h2>

                {/* Handle */}
                <p className="text-gray-600 text-lg">
                    {displayedUser ? `@${displayedUser.username}` : ""}
                </p>

                {displayedUser ? (
                  <p className="text-sm text-gray-500">
                    {displayedUser.reviewCount} review{displayedUser.reviewCount === 1 ? "" : "s"}
                  </p>
                ) : null}
            </div>

            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-amber-900">
                Reviews
              </h3>

              {isLoadingReviews ? (
                <p className="text-gray-600">Loading reviews...</p>
              ) : displayedUserReviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet.</p>
              ) : (
                <div className="space-y-4">
                  {displayedUserReviews.map((review) => (
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
        <section className="md:col-span-2 p-6 overflow-y-auto">
        
          {/* Filter Buttons */}
          <div className="flex gap-4 mb-4">
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

          <div className="mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search users"
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900"
            />
          </div>

          {/* Users Content Area */}
          <div>
            {activeFilter === "top" ? (
              isLoadingUsers ? (
                <p className="text-gray-600">Loading users...</p>
              ) : topUsers.length === 0 ? (
                <p className="text-gray-600">No users found.</p>
              ) : (
                <div className="space-y-4">
                  {topUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onClick={() => setSelectedUser(user)}
                      isSelected={displayedUser?.id === user.id}
                    />
                  ))}
                </div>
              )
            ) : (
              <div className="mt-6">
                <p className="text-gray-600">
                  Friends will go here once the friends endpoint is ready.
                </p>
              </div>
            )}
            
          </div>

        </section>

      </div>
    </main>
  )
}