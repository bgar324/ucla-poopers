"use client"

import Avatar from "../components/UserAvatar"

interface UserItem {
  id: string
  firstName: string
  lastName: string
  username: string
  reviewCount: number
  followingCount: number
  followerCount: number
  avatarUrl: string | null
}

interface UserCardProps {
  user: UserItem
  onClick?: () => void
  isSelected?: boolean
  isFollowing?: boolean
  showFollowButton?: boolean
  onToggleFollow?: () => void
  isTogglingFollow?: boolean
}

export default function UserCard({
  user,
  onClick,
  isSelected = false,
  isFollowing = false,
  showFollowButton = false,
  onToggleFollow,
  isTogglingFollow = false,
}: UserCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault()
          onClick?.()
        }
      }}
      aria-pressed={isSelected}
      className={`block w-full rounded-xl border border-amber-900 p-4 text-left shadow-sm transition hover:shadow-md cursor-pointer ${
        isSelected ? "bg-amber-50 shadow-md" : "bg-rose-50"
      }`}
    >
      <div className="flex items-center gap-4">
        <Avatar
          size={56}
          src={user.avatarUrl ?? undefined}
        />

        <div className="flex-1">
          <p className="font-rubik font-medium text-amber-900">
            {user.firstName} {user.lastName}
          </p>

          <p className="mt-1 font-rubik text-sm text-gray-600">
            @{user.username}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full bg-amber-100 px-2 py-1 font-rubik text-xs text-amber-900">
              {user.reviewCount} review{user.reviewCount === 1 ? "" : "s"}
            </span>

            <span className="rounded-full border border-amber-900/10 bg-white/80 px-2 py-1 font-rubik text-xs text-amber-800">
              {user.followerCount} follower{user.followerCount === 1 ? "" : "s"}
            </span>

            <span className="rounded-full border border-amber-900/10 bg-white/80 px-2 py-1 font-rubik text-xs text-amber-800">
              {user.followingCount} following
            </span>
          </div>
        </div>

        {showFollowButton ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onToggleFollow?.()
            }}
            disabled={isTogglingFollow}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              isFollowing
                ? "border border-amber-900 bg-amber-900 text-white hover:bg-amber-800"
                : "border border-amber-900 bg-white text-amber-900 hover:bg-amber-100"
            } ${isTogglingFollow ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
          >
            {isTogglingFollow ? "Updating..." : isFollowing ? "Following" : "Follow"}
          </button>
        ) : null}
      </div>
    </div>
  )
}
