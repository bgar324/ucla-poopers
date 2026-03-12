"use client";

import Navbar from "../components/Navbar";
import ToiletBG from "../components/ToiletBG";
import { useState, useEffect, useMemo, useCallback } from "react";
import Avatar from "../components/UserAvatar";
import UserCard from "../components/UserCard";
import BathroomDetailPanel from "../components/BathroomDetailPanel";
import ConfirmActionModal from "../components/ConfirmActionModal";
import SocialConnectionsModal from "../components/SocialConnectionsModal";
import SpotCard from "../components/SpotCard";
import Rating from "../components/Rating";
import supabase from "@/supabaseClient";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

interface ProfileRecord {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
  followingCount: number;
  followerCount: number;
}

interface UserRecord {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  reviewCount: number;
  followingCount: number;
  followerCount: number;
}

interface ReviewRecord {
  id: string;
  rating: number;
  description: string;
  created_at: string;
  user: {
    username: string;
  };
  bathroom: {
    id: string;
    name: string;
    building: string;
    floor: number;
    type: string;
    isOpen: boolean;
  };
}

interface FeedActivityRecord {
  id: string;
  type: "rated_restroom" | "created_restroom";
  createdAt: string;
  actor: {
    id: string;
    username: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  bathroom: {
    id: string;
    name: string;
    building: string;
    floor: number;
    type: string;
    typeLabel: string;
    isOpen: boolean;
  };
  review: {
    id: string;
    rating: number;
    description: string;
  };
}

type SocialListKind = "followers" | "following";

function formatFeedTime(value: string) {
  const date = new Date(value);
  const timestamp = date.getTime();

  if (Number.isNaN(timestamp)) {
    return "";
  }

  const diff = Date.now() - timestamp;
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;

  if (diff < minute) {
    return "Just now";
  }

  if (diff < hour) {
    return `${Math.floor(diff / minute)}m ago`;
  }

  if (diff < day) {
    return `${Math.floor(diff / hour)}h ago`;
  }

  if (diff < week) {
    return `${Math.floor(diff / day)}d ago`;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getFeedActionLabel(type: FeedActivityRecord["type"]) {
  return type === "created_restroom" ? "Created restroom" : "Rated restroom";
}

export default function PoopersProfilePage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState("top");
  const [searchQuery, setSearchQuery] = useState("");
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [feedActivities, setFeedActivities] = useState<FeedActivityRecord[]>(
    [],
  );
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [followingUsers, setFollowingUsers] = useState<UserRecord[]>([]);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<{
    reviewId: string;
    bathroomId: string;
    initialEditingReviewId?: string | null;
    editorRequestKey?: number;
  } | null>(null);
  const [reviewPendingDelete, setReviewPendingDelete] =
    useState<ReviewRecord | null>(null);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingFollowing, setIsLoadingFollowing] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [socialListView, setSocialListView] = useState<{
    kind: SocialListKind;
    userId: string;
    username: string;
  } | null>(null);
  const [socialListUsers, setSocialListUsers] = useState<UserRecord[]>([]);
  const [isLoadingSocialList, setIsLoadingSocialList] = useState(false);
  const [socialListError, setSocialListError] = useState("");

  const filters = [
    { label: "Top", value: "top" },
    { label: "Feed", value: "feed" },
  ];

  const getAccessToken = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return session?.access_token ?? null;
  }, []);

  const loadFollowing = useCallback(async () => {
    setIsLoadingFollowing(true);

    const accessToken = await getAccessToken();

    if (!accessToken) {
      setFollowingUsers([]);
      setIsLoadingFollowing(false);
      return;
    }

    const response = await fetch("/api/follow", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      setFollowingUsers([]);
      setIsLoadingFollowing(false);
      return;
    }

    const data = (await response.json()) as { users: UserRecord[] };
    setFollowingUsers(data.users);
    setIsLoadingFollowing(false);
  }, [getAccessToken]);

  const loadProfile = useCallback(async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.replace("/");
      return;
    }

    const response = await fetch("/api/profile", {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as { user: ProfileRecord };
    setProfile(data.user);
  }, [router]);

  const loadUsers = useCallback(async () => {
    setIsLoadingUsers(true);

    const response = await fetch("/api/users");

    if (!response.ok) {
      setIsLoadingUsers(false);
      return;
    }

    const data = (await response.json()) as { users: UserRecord[] };
    setUsers(data.users);
    setIsLoadingUsers(false);
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const loadReviews = useCallback(async () => {
    setIsLoadingReviews(true);

    const response = await fetch("/api/reviews");

    if (!response.ok) {
      setIsLoadingReviews(false);
      return;
    }

    const data = (await response.json()) as { reviews: ReviewRecord[] };
    setReviews(data.reviews);
    setIsLoadingReviews(false);
  }, []);

  const loadFeed = useCallback(async () => {
    setIsLoadingFeed(true);
    setFeedError("");

    const accessToken = await getAccessToken();

    if (!accessToken) {
      setFeedActivities([]);
      setIsLoadingFeed(false);
      return;
    }

    const response = await fetch("/api/feed", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await response.json().catch(() => null)) as
      | { activities: FeedActivityRecord[]; error?: never }
      | { error?: string }
      | null;

    if (!response.ok || !data || !("activities" in data)) {
      setFeedActivities([]);
      setFeedError(
        data && "error" in data && data.error
          ? data.error
          : "Failed to load your feed.",
      );
      setIsLoadingFeed(false);
      return;
    }

    setFeedActivities(data.activities);
    setIsLoadingFeed(false);
  }, [getAccessToken]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    void loadFollowing();
  }, [loadFollowing]);

  useEffect(() => {
    if (profile && !selectedUserId) {
      setSelectedUserId(profile.id);
    }
  }, [profile, selectedUserId]);

  const profileFallbackUser = useMemo(() => {
    if (!profile) {
      return null;
    }

    return {
      id: profile.id,
      username: profile.username,
      firstName: profile.firstName,
      lastName: profile.lastName,
      avatarUrl: profile.avatarUrl,
      reviewCount: reviews.filter(
        (review) => review.user.username === profile.username,
      ).length,
      followingCount: profile.followingCount,
      followerCount: profile.followerCount,
    };
  }, [profile, reviews]);

  const displayedUser = useMemo(() => {
    if (selectedUserId) {
      return (
        users.find((user) => user.id === selectedUserId) ??
        (profileFallbackUser?.id === selectedUserId
          ? profileFallbackUser
          : null)
      );
    }

    if (profile) {
      return (
        users.find((user) => user.id === profile.id) ?? profileFallbackUser
      );
    }

    return null;
  }, [profile, profileFallbackUser, selectedUserId, users]);

  const displayedUserReviews = displayedUser
    ? reviews.filter(
        (review) => review.user.username === displayedUser.username,
      )
    : [];
  const displayedUserReviewCount = displayedUserReviews.length;

  const reviewCountsByBathroom = reviews.reduce<Record<string, number>>(
    (counts, review) => {
      counts[review.bathroom.id] = (counts[review.bathroom.id] ?? 0) + 1;
      return counts;
    },
    {},
  );

  useEffect(() => {
    if (!selectedReview) {
      return;
    }

    const stillVisible = displayedUserReviews.some(
      (review) => review.id === selectedReview.reviewId,
    );

    if (!stillVisible) {
      setSelectedReview(null);
    }
  }, [displayedUserReviews, selectedReview]);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredTopUsers = users.filter((user) => {
    if (!normalizedQuery) {
      return true;
    }

    const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();

    return (
      fullName.includes(normalizedQuery) ||
      user.firstName.toLowerCase().includes(normalizedQuery) ||
      user.lastName.toLowerCase().includes(normalizedQuery) ||
      user.username.toLowerCase().includes(normalizedQuery)
    );
  });

  const filteredFeedActivities = useMemo(() => {
    if (!normalizedQuery) {
      return feedActivities;
    }

    return feedActivities.filter((activity) => {
      const haystack = [
        activity.actor.firstName,
        activity.actor.lastName,
        activity.actor.username,
        activity.bathroom.name,
        activity.bathroom.building,
        activity.bathroom.typeLabel,
        getFeedActionLabel(activity.type),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [feedActivities, normalizedQuery]);

  const followedUserIds = useMemo(() => {
    return new Set(followingUsers.map((user) => user.id));
  }, [followingUsers]);

  const canViewDisplayedUserConnections = useMemo(() => {
    if (!profile || !displayedUser) {
      return false;
    }

    return (
      profile.id === displayedUser.id || followedUserIds.has(displayedUser.id)
    );
  }, [displayedUser, followedUserIds, profile]);

  useEffect(() => {
    if (!socialListView) {
      return;
    }

    let active = true;

    const load = async () => {
      setIsLoadingSocialList(true);
      setSocialListError("");
      setSocialListUsers([]);

      const accessToken = await getAccessToken();

      if (!accessToken) {
        if (active) {
          setIsLoadingSocialList(false);
        }
        router.replace("/");
        return;
      }

      const searchParams = new URLSearchParams({
        list: socialListView.kind,
        targetUserId: socialListView.userId,
      });

      const response = await fetch(`/api/follow?${searchParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = (await response.json().catch(() => null)) as
        | { users: UserRecord[]; error?: never }
        | { error?: string }
        | null;

      if (!active) {
        return;
      }

      if (!response.ok || !data || !("users" in data)) {
        setSocialListUsers([]);
        setSocialListError(
          data && "error" in data && data.error
            ? data.error
            : `Failed to load ${socialListView.kind}.`,
        );
        setIsLoadingSocialList(false);
        return;
      }

      setSocialListUsers(data.users);
      setIsLoadingSocialList(false);
    };

    void load();

    return () => {
      active = false;
    };
  }, [getAccessToken, router, socialListView]);

  useEffect(() => {
    if (!socialListView || !displayedUser) {
      return;
    }

    if (
      socialListView.userId !== displayedUser.id ||
      !canViewDisplayedUserConnections
    ) {
      setSocialListView(null);
    }
  }, [canViewDisplayedUserConnections, displayedUser, socialListView]);

  const handleOpenSocialList = useCallback(
    (kind: SocialListKind) => {
      if (!displayedUser || !canViewDisplayedUserConnections) {
        return;
      }

      setSocialListView({
        kind,
        userId: displayedUser.id,
        username: displayedUser.username,
      });
    },
    [canViewDisplayedUserConnections, displayedUser],
  );

  const handleToggleFollow = useCallback(
    async (targetUser: UserRecord) => {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        router.replace("/");
        return;
      }

      const isCurrentlyFollowing = followedUserIds.has(targetUser.id);
      setTogglingUserId(targetUser.id);

      try {
        const response = await fetch("/api/follow", {
          method: isCurrentlyFollowing ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            followingId: targetUser.id,
          }),
        });

        await response.json().catch(() => null);

        if (!response.ok) {
          return;
        }

        await Promise.all([
          loadFollowing(),
          loadUsers(),
          loadProfile(),
          loadFeed(),
        ]);
      } finally {
        setTogglingUserId(null);
      }
    },
    [
      followedUserIds,
      getAccessToken,
      loadFeed,
      loadFollowing,
      loadProfile,
      loadUsers,
      router,
    ],
  );

  const handleDeleteReview = useCallback(async () => {
    if (!reviewPendingDelete) {
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      router.replace("/");
      return;
    }

    setDeletingReviewId(reviewPendingDelete.id);

    try {
      const response = await fetch("/api/reviews", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supabaseAuthId: session.user.id,
          reviewId: reviewPendingDelete.id,
          bathroomId: reviewPendingDelete.bathroom.id,
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        console.error("delete review failed", response.status, result);
        return;
      }

      setSelectedReview((current) =>
        current?.reviewId === reviewPendingDelete.id ? null : current,
      );
      setReviewPendingDelete(null);
      await loadReviews();
    } finally {
      setDeletingReviewId(null);
    }
  }, [loadReviews, reviewPendingDelete, router]);

  const socialListTitle = socialListView
    ? `${socialListView.kind === "followers" ? "Followers" : "Following"} of @${socialListView.username}`
    : "";

  const socialListDescription = socialListView
    ? profile?.id === socialListView.userId
      ? `Browse the people in your ${socialListView.kind === "followers" ? "followers" : "following"} list.`
      : `Because you follow @${socialListView.username}, you can browse their ${socialListView.kind}.`
    : "";

  const socialListEmptyMessage = socialListView
    ? socialListView.kind === "followers"
      ? "No followers yet."
      : "Not following anyone yet."
    : "";

  return (
    <main className="h-screen overflow-hidden">
      <SocialConnectionsModal
        isOpen={Boolean(socialListView)}
        title={socialListTitle}
        description={socialListDescription}
        users={socialListUsers}
        isLoading={isLoadingSocialList}
        errorMessage={socialListError}
        emptyMessage={socialListEmptyMessage}
        selectedUserId={selectedUserId}
        onClose={() => setSocialListView(null)}
        onSelectUser={(userId) => {
          setSelectedUserId(userId);
          setSocialListView(null);
        }}
      />

      <ConfirmActionModal
        isOpen={Boolean(reviewPendingDelete)}
        title="Delete this review?"
        description={
          reviewPendingDelete
            ? `This removes your review from ${reviewPendingDelete.bathroom.name}. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete review"
        cancelLabel="Keep review"
        isConfirming={Boolean(deletingReviewId)}
        onCancel={() => {
          if (!deletingReviewId) {
            setReviewPendingDelete(null);
          }
        }}
        onConfirm={() => void handleDeleteReview()}
      />

      <Navbar />

      <div className="grid grid-cols-1 md:grid-cols-3 h-[calc(100vh-80px)]">
        <aside className="md:col-span-1 bg-white/90 p-6 overflow-y-auto backdrop-blur-sm">
          <div className="flex flex-col items-center text-center space-y-2">
            <Avatar size={220} src={displayedUser?.avatarUrl ?? undefined} />

            <h2 className="text-2xl font-semibold mt-2">
              {displayedUser
                ? `${displayedUser.firstName} ${displayedUser.lastName}`
                : "Loading..."}
            </h2>

            <p className="text-gray-600 text-lg">
              {displayedUser ? `@${displayedUser.username}` : ""}
            </p>

            {displayedUser ? (
              <div className="mt-3 w-full max-w-sm">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-amber-50 px-3 py-3">
                    <p className="text-lg font-semibold text-amber-900">
                      {displayedUserReviewCount}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-amber-700">
                      Reviews
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenSocialList("followers")}
                    disabled={!canViewDisplayedUserConnections}
                    aria-haspopup="dialog"
                    className={`rounded-2xl px-3 py-3 text-left shadow-sm ring-1 ring-amber-900/10 transition ${
                      canViewDisplayedUserConnections
                        ? "bg-white hover:-translate-y-0.5 hover:bg-amber-50 cursor-pointer"
                        : "bg-white/80 opacity-70 cursor-not-allowed"
                    }`}
                  >
                    <p className="text-lg font-semibold text-amber-900 text-center">
                      {displayedUser.followerCount}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-amber-700 text-center">
                      Followers
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenSocialList("following")}
                    disabled={!canViewDisplayedUserConnections}
                    aria-haspopup="dialog"
                    className={`rounded-2xl px-3 py-3 text-left shadow-sm ring-1 ring-amber-900/10 transition ${
                      canViewDisplayedUserConnections
                        ? "bg-white hover:-translate-y-0.5 hover:bg-amber-50 cursor-pointer"
                        : "bg-white/80 opacity-70 cursor-not-allowed"
                    }`}
                  >
                    <p className="text-lg font-semibold text-amber-900 text-center">
                      {displayedUser.followingCount}
                    </p>
                    <p className="text-[11px] uppercase tracking-[0.2em] text-amber-700 text-center">
                      Following
                    </p>
                  </button>
                </div>

                <p className="mt-3 min-h-5 text-xs text-slate-500">
                  {canViewDisplayedUserConnections
                    ? "Tap Followers or Following to browse the list."
                    : `Follow @${displayedUser.username} to view their followers and following.`}
                </p>
              </div>
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
                  <div key={review.id} className="relative">
                    {profile?.id === displayedUser?.id ? (
                      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedReview({
                              reviewId: review.id,
                              bathroomId: review.bathroom.id,
                              initialEditingReviewId: review.id,
                              editorRequestKey: Date.now(),
                            })
                          }
                          className="rounded-full border border-amber-900/20 bg-white/90 p-2 text-amber-900 transition hover:bg-rose-50 hover:cursor-pointer"
                          aria-label="Edit this review"
                        >
                          <Pencil size={14} strokeWidth={2} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setReviewPendingDelete(review)}
                          disabled={deletingReviewId === review.id}
                          className="rounded-full border border-red-200 bg-white/90 p-2 text-red-700 transition hover:bg-red-50 hover:cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                          aria-label="Delete this review"
                        >
                          <Trash2 size={14} strokeWidth={2} />
                        </button>
                      </div>
                    ) : null}

                    <SpotCard
                      spot={{
                        id: review.bathroom.id,
                        rating: review.rating,
                        name: review.bathroom.name,
                        detail: review.description || "No written review.",
                        reviewCount:
                          reviewCountsByBathroom[review.bathroom.id] ?? 0,
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
                          initialEditingReviewId: null,
                          editorRequestKey: 0,
                        })
                      }
                      isSelected={selectedReview?.reviewId === review.id}
                    />
                  </div>
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
              initialEditingReviewId={
                selectedReview.initialEditingReviewId ?? null
              }
              editorRequestKey={selectedReview.editorRequestKey ?? 0}
              onReviewSaved={loadReviews}
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
                  placeholder={
                    activeFilter === "top" ? "Search people" : "Search feed"
                  }
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
                          onClick={() => setSelectedUserId(user.id)}
                          isSelected={displayedUser?.id === user.id}
                          isFollowing={followedUserIds.has(user.id)}
                          showFollowButton={profile?.id !== user.id}
                          onToggleFollow={() => void handleToggleFollow(user)}
                          isTogglingFollow={togglingUserId === user.id}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="space-y-4">
                    {isLoadingFeed || isLoadingFollowing ? (
                      <p className="text-gray-600">Loading feed...</p>
                    ) : feedError ? (
                      <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {feedError}
                      </p>
                    ) : followingUsers.length === 0 ? (
                      <div className="rounded-[1.75rem] border border-dashed border-amber-900/20 bg-white/75 p-6">
                        <p className="font-rubik text-lg text-amber-900">
                          Follow people to build your feed.
                        </p>
                        <p className="mt-2 font-rubik text-sm leading-6 text-slate-600">
                          When people you follow rate a restroom or create a new
                          one, it will land here with the newest activity first.
                        </p>
                      </div>
                    ) : filteredFeedActivities.length === 0 ? (
                      <div className="rounded-[1.75rem] border border-dashed border-amber-900/20 bg-white/75 p-6">
                        <p className="font-rubik text-lg text-amber-900">
                          No matching feed activity yet.
                        </p>
                        <p className="mt-2 font-rubik text-sm leading-6 text-slate-600">
                          Try a different search, or wait for the people you
                          follow to post new restroom activity.
                        </p>
                      </div>
                    ) : (
                      filteredFeedActivities.map((activity) => (
                        <article
                          key={activity.id}
                          className="rounded-[1.75rem] border border-amber-900/15 bg-white/85 p-5 shadow-[0_18px_45px_rgba(120,53,15,0.08)] transition hover:shadow-[0_24px_55px_rgba(120,53,15,0.12)]"
                        >
                          <div className="flex items-start gap-4">
                            <Avatar
                              size={56}
                              src={activity.actor.avatarUrl ?? undefined}
                            />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-baseline gap-2">
                                <div className="flex flex-wrap items-baseline gap-1 text-base text-slate-800">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setSelectedUserId(activity.actor.id)
                                    }
                                    className="font-rubik font-semibold text-amber-900 transition hover:text-amber-700 hover:underline cursor-pointer"
                                  >
                                    {activity.actor.firstName}{" "}
                                    {activity.actor.lastName}
                                  </button>

                                  <span className="font-rubik">
                                    {activity.type === "created_restroom"
                                      ? "created"
                                      : "rated"}{" "}
                                    <span className="text-amber-900">
                                      {activity.bathroom.name}
                                    </span>
                                  </span>
                                </div>

                                <span className="ml-auto shrink-0 font-rubik text-xs uppercase tracking-[0.16em] text-slate-400">
                                  {formatFeedTime(activity.createdAt)}
                                </span>
                              </div>

                              {activity.review.rating > 0 && (
                                <div className="mt-3 flex items-center gap-3">
                                  <Rating value={activity.review.rating} />
                                  <span className="font-rubik text-sm font-medium text-amber-900">
                                    {activity.review.rating}/5 poops
                                  </span>
                                </div>
                              )}

                              {activity.review.description && (
                                <div className="mt-3 rounded-[1.25rem] border border-amber-900/10 bg-amber-50/70 px-4 py-3">
                                  <p className="font-rubik text-sm leading-7 text-slate-700">
                                    {activity.review.description}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
