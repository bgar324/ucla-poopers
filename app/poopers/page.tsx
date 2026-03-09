"use client"

import Navbar from "../components/Navbar"
import ToiletBG from "../components/ToiletBG"
import { useState, useEffect, useMemo, useCallback } from "react"
import Avatar from "../components/UserAvatar"
import UserCard from "../components/UserCard"
import BathroomDetailPanel from "../components/BathroomDetailPanel"
import SpotCard from "../components/SpotCard"
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
    isOpen: boolean
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
  const [followingUsers, setFollowingUsers] = useState<UserRecord[]>([])
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)
  const [selectedReview, setSelectedReview] = useState<{
    reviewId: string
    bathroomId: string
  } | null>(null)
  const [isLoadingReviews, setIsLoadingReviews] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(true)

  const filters = [
    { label: "Top", value: "top" },
    { label: "Following", value: "following" },
  ]

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    return session?.access_token ?? null
  }, [])

  const loadFollowing = useCallback(async () => {
    setIsLoadingFollowing(true)

    const accessToken = await getAccessToken()

    if (!accessToken) {
      setFollowingUsers([])
      setIsLoadingFollowing(false)
      return
    }

    const response = await fetch("/api/follow", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      setFollowingUsers([])
      setIsLoadingFollowing(false)
      return
    }

    const data = (await response.json()) as { users: UserRecord[] }
    setFollowingUsers(data.users)
    setIsLoadingFollowing(false)
  }, [getAccessToken])

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
    void loadFollowing()
  }, [loadFollowing])

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

  const reviewCountsByBathroom = reviews.reduce<Record<string, number>>((counts, review) => {
    counts[review.bathroom.id] = (counts[review.bathroom.id] ?? 0) + 1
    return counts
  }, {})

  useEffect(() => {
    if (!selectedReview) {
      return
    }

    const stillVisible = displayedUserReviews.some(
      (review) => review.id === selectedReview.reviewId
    )

    if (!stillVisible) {
      setSelectedReview(null)
    }
  }, [displayedUserReviews, selectedReview])

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const filteredTopUsers = users.filter((user) => {
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

  const filteredFollowingUsers = followingUsers.filter((user) => {
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

  const followedUserIds = useMemo(() => {
    return new Set(followingUsers.map((user) => user.id))
  }, [followingUsers])

  const handleToggleFollow = useCallback(
    async (targetUser: UserRecord) => {
      const accessToken = await getAccessToken()
      console.log("accessToken exists?", Boolean(accessToken))
      console.log("target user", targetUser)

      if (!accessToken) {
        console.log("No access token")
        router.replace("/")
        return
      }

      const isCurrentlyFollowing = followedUserIds.has(targetUser.id)
      setTogglingUserId(targetUser.id)

      const response = await fetch("/api/follow", {
        method: isCurrentlyFollowing ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          followingId: targetUser.id,
        }),
      })

      const result = await response.json().catch(() => null)
      console.log("follow response status", response.status)
      console.log("follow response body", result)

      if (!response.ok) {
        setTogglingUserId(null)
        return
      }

      if (isCurrentlyFollowing) {
        setFollowingUsers((current) =>
          current.filter((user) => user.id !== targetUser.id)
        )
      } else {
        setFollowingUsers((current) => {
          const alreadyExists = current.some((user) => user.id === targetUser.id)
          if (alreadyExists) {
            return current
          }

          return [...current, targetUser].sort((a, b) => {
            if (b.reviewCount !== a.reviewCount) {
              return b.reviewCount - a.reviewCount
            }

            return a.username.localeCompare(b.username)
          })
        })
      }

      setTogglingUserId(null)
    },
    [followedUserIds, getAccessToken, router],
  )

  return (
    <main className="h-screen overflow-hidden">
      <Navbar />

      <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-80px)]">
        <aside className="md:col-span-1 bg-white/90 p-6 overflow-y-auto backdrop-blur-sm">
          <div className="flex flex-col items-center text-center space-y-2">
            <Avatar
              size={220}
              src={displayedUser?.avatarUrl ?? undefined}
            />

            <h2 className="text-2xl font-semibold mt-2">
              {displayedUser ? `${displayedUser.firstName} ${displayedUser.lastName}` : "Loading..."}
            </h2>

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
                  <SpotCard
                    key={review.id}
                    spot={{
                      id: review.bathroom.id,
                      rating: review.rating,
                      name: review.bathroom.name,
                      detail: review.description || "No written review.",
                      reviewCount: reviewCountsByBathroom[review.bathroom.id] ?? 0,
                      isOpen: review.bathroom.isOpen,
                      typeLabel:
                        review.bathroom.type === "accessible"
                          ? "Accessible"
                          : review.bathroom.type === "female"
                            ? "Female"
                            : review.bathroom.type === "male"
                              ? "Male"
                              : "Gender Neutral",
                    }}
                    onClick={() =>
                      setSelectedReview({
                        reviewId: review.id,
                        bathroomId: review.bathroom.id,
                      })
                    }
                    isSelected={selectedReview?.reviewId === review.id}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="relative md:col-span-2 overflow-hidden bg-[#f8f4e6]">
          <ToiletBG />

          {selectedReview ? (
            <BathroomDetailPanel
              bathroomId={selectedReview.bathroomId}
              onBack={() => setSelectedReview(null)}
              backLabel="Back to poopers"
              variant="embedded"
            />
          ) : (
            <div className="relative z-10 h-full overflow-y-auto p-6">
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

              <div>
                {activeFilter === "top" ? (
                  isLoadingUsers ? (
                    <p className="text-gray-600">Loading users...</p>
                  ) : filteredTopUsers.length === 0 ? (
                    <p className="text-gray-600">No users found.</p>
                  ) : (
                    <div className="space-y-4">
                      {filteredTopUsers.map((user) => (
                        <UserCard
                          key={user.id}
                          user={user}
                          onClick={() => setSelectedUser(user)}
                          isSelected={displayedUser?.id === user.id}
                          isFollowing={followedUserIds.has(user.id)}
                          showFollowButton={profile?.id !== user.id}
                          onToggleFollow={() => void handleToggleFollow(user)}
                          isTogglingFollow={togglingUserId === user.id}
                        />
                      ))}
                    </div>
                  )
                ) : isLoadingFollowing ? (
                  <p className="text-gray-600">Loading following...</p>
                ) : filteredFollowingUsers.length === 0 ? (
                  <div className="mt-6">
                    <p className="text-gray-600">You are not following anyone yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredFollowingUsers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onClick={() => setSelectedUser(user)}
                        isSelected={displayedUser?.id === user.id}
                        isFollowing
                        showFollowButton={profile?.id !== user.id}
                        onToggleFollow={() => void handleToggleFollow(user)}
                        isTogglingFollow={togglingUserId === user.id}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}