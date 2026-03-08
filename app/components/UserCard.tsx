"use client"

interface UserItem {
  id: string
  firstName: string
  lastName: string
  username: string
  reviewCount: number
}

interface UserCardProps {
  user: UserItem
  onClick?: () => void
  isSelected?: boolean
}

export default function UserCard({
  user,
  onClick,
  isSelected = false,
}: UserCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isSelected}
      className={`block w-full rounded-xl border border-amber-900 p-4 text-left shadow-sm transition hover:shadow-md ${
        isSelected ? "bg-amber-50 shadow-md" : "bg-rose-50"
      }`}
    >
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
      </div>
    </button>
  )
}