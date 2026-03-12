import prisma from "@/lib/prisma";
import { requireAuthUser } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type FeedActivityType = "rated_restroom" | "created_restroom";

interface FeedRouteUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
}

interface FeedRouteReviewRecord {
  id: string;
  user_id: string;
  rating: number;
  description: string;
  created_at: Date;
  user: FeedRouteUser | null;
  bathroom: {
    id: string;
    name: string;
    building: string;
    floor: number;
    type: string;
    is_closed: boolean;
    createdAt: Date | null;
    created_by: string | null;
    reviews: {
      id: string;
      created_at: Date;
    }[];
  };
}

interface FeedRouteBathroomRecord {
  id: string;
  name: string;
  building: string;
  floor: number;
  type: string;
  is_closed: boolean;
  createdAt: Date | null;
  created_by: string | null;
  creator: FeedRouteUser | null;
  reviews: {
    id: string;
    rating: number;
    description: string;
    created_at: Date;
  }[];
}

function formatBathroomType(type: string) {
  switch (type) {
    case "accessible":
      return "Accessible";
    case "female":
      return "Female";
    case "male":
      return "Male";
    default:
      return "Gender Neutral";
  }
}

function sortByNewest<T extends { createdAt: string }>(items: T[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuthUser(request);

    const currentUser = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: { id: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const follows = await prisma.follow.findMany({
      where: { followerId: currentUser.id },
      select: { followingId: true },
    });

    if (follows.length === 0) {
      return NextResponse.json({ activities: [] });
    }

    const followedUserIds = follows.map((follow) => follow.followingId);

    const [reviews, createdBathrooms] = await Promise.all([
      prisma.review.findMany({
        where: {
          user_id: { in: followedUserIds },
        },
        select: {
          id: true,
          user_id: true,
          rating: true,
          description: true,
          created_at: true,
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          bathroom: {
            select: {
              id: true,
              name: true,
              building: true,
              floor: true,
              type: true,
              is_closed: true,
              createdAt: true,
              created_by: true,
              reviews: {
                orderBy: { created_at: "asc" },
                take: 1,
                select: {
                  id: true,
                  created_at: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 100,
      }) as Promise<FeedRouteReviewRecord[]>,
      prisma.bathroom.findMany({
        where: {
          created_by: { in: followedUserIds },
        },
        select: {
          id: true,
          name: true,
          building: true,
          floor: true,
          type: true,
          is_closed: true,
          createdAt: true,
          created_by: true,
          creator: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          reviews: {
            orderBy: { created_at: "asc" },
            take: 1,
            select: {
              id: true,
              rating: true,
              description: true,
              created_at: true,
            },
          },
        },
        take: 100,
      }) as Promise<FeedRouteBathroomRecord[]>,
    ]);

    const ratingActivities = reviews.flatMap((review) => {
      const firstBathroomReview = review.bathroom.reviews[0];
      const isCreationReview =
        Boolean(review.bathroom.createdAt) &&
        review.bathroom.created_by === review.user_id &&
        firstBathroomReview?.id === review.id;

      if (isCreationReview || !review.user) {
        return [];
      }

      return [
        {
          id: `review:${review.id}`,
          type: "rated_restroom" as FeedActivityType,
          createdAt: review.created_at.toISOString(),
          actor: review.user,
          bathroom: {
            id: review.bathroom.id,
            name: review.bathroom.name,
            building: review.bathroom.building,
            floor: review.bathroom.floor,
            type: review.bathroom.type,
            typeLabel: formatBathroomType(review.bathroom.type),
            isOpen: !review.bathroom.is_closed,
          },
          review: {
            id: review.id,
            rating: review.rating,
            description: review.description,
          },
        },
      ];
    });

    const creationActivities = createdBathrooms.flatMap((bathroom) => {
      const firstReview = bathroom.reviews[0];

      if (!bathroom.creator || !bathroom.createdAt) {
        return [];
      }

      return [
        {
          id: `bathroom:${bathroom.id}`,
          type: "created_restroom" as FeedActivityType,
          createdAt: bathroom.createdAt.toISOString(),
          actor: bathroom.creator,
          bathroom: {
            id: bathroom.id,
            name: bathroom.name,
            building: bathroom.building,
            floor: bathroom.floor,
            type: bathroom.type,
            typeLabel: formatBathroomType(bathroom.type),
            isOpen: !bathroom.is_closed,
          },
          review: {
            id: firstReview?.id ?? `bathroom:${bathroom.id}:creation`,
            rating: firstReview?.rating ?? 0,
            description: firstReview?.description ?? "",
          },
        },
      ];
    });

    return NextResponse.json({
      activities: sortByNewest([...ratingActivities, ...creationActivities]).slice(0, 100),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch feed.";
    const status =
      message === "Missing bearer token." || message === "Unauthorized."
        ? 401
        : 500;

    console.error("GET FEED ERROR:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
