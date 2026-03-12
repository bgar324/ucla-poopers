import { generateBathroomSummary, MIN_REVIEWS_FOR_AI_SUMMARY } from "@/lib/geminiBathroomSummary";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const EMPTY_REVIEW_DETAIL = "Looks like no one has pooped here yet.";

interface BathroomDetailRouteReview {
  id: string;
  rating: number;
  description: string;
  created_at: Date;
  edited_at: Date | null;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  } | null;
}

interface BathroomDetailRouteBathroom {
  id: string;
  name: string;
  building: string;
  floor: number;
  latitude: number;
  longitude: number;
  type: string;
  is_closed: boolean;
  created_by: string | null;
  createdAt: Date | null;
  reviewSummary: string | null;
  reviewSummaryReviewCount: number | null;
  creator: {
    id: string;
    username: string;
  } | null;
  reviews: BathroomDetailRouteReview[];
}

function formatBathroomType(type: string): string {
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

function getAverageRating(ratings: number[]): number {
  if (ratings.length === 0) {
    return 0;
  }

  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

function getFallbackDetail(
  building: string,
  floor: number,
  type: string,
  reviewCount: number,
  primaryReview?: { description: string },
) {
  if (reviewCount === 0) {
    return EMPTY_REVIEW_DETAIL;
  }

  return (
    primaryReview?.description ||
    `${building} floor ${floor} ${formatBathroomType(type)}`
  );
}

function isFiniteCoordinate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  void request;

  try {
    const { id } = await params;

    const bathroom = (await prisma.bathroom.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        reviews: {
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            rating: true,
            description: true,
            created_at: true,
            edited_at: true,
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    })) as BathroomDetailRouteBathroom | null;

    if (!bathroom) {
      return NextResponse.json(
        { error: "Bathroom not found." },
        { status: 404 },
      );
    }

    const ratings = bathroom.reviews.map((review) => review.rating);
    const averageRating = getAverageRating(ratings);
    const primaryReview = bathroom.reviews[0];
    const reviewCount = bathroom.reviews.length;
    const fallbackDetail = getFallbackDetail(
      bathroom.building,
      bathroom.floor,
      bathroom.type,
      reviewCount,
      primaryReview,
    );
    const createdAt = bathroom.createdAt;
    const cachedSummary =
      typeof bathroom.reviewSummary === "string"
        ? bathroom.reviewSummary.trim()
        : "";
    const hasAnyCachedSummary = cachedSummary.length > 0;

    let detail = fallbackDetail;

    const canUseAiSummary = reviewCount >= MIN_REVIEWS_FOR_AI_SUMMARY;
    const hasCachedSummary =
      canUseAiSummary &&
      hasAnyCachedSummary &&
      bathroom.reviewSummaryReviewCount === reviewCount;

    if (hasCachedSummary) {
      detail = cachedSummary;
    } else if (canUseAiSummary) {
      try {
        const summary = await generateBathroomSummary({
          bathroomName: bathroom.name,
          building: bathroom.building,
          floor: bathroom.floor,
          typeLabel: formatBathroomType(bathroom.type),
          reviews: bathroom.reviews.map((review) => ({
            rating: review.rating,
            description: review.description,
          })),
        });

        if (summary) {
          detail = summary;

          await prisma.bathroom.update({
            where: { id: bathroom.id },
            data: {
              reviewSummary: summary,
              reviewSummaryReviewCount: reviewCount,
              reviewSummaryUpdatedAt: new Date(),
            },
          });
        } else if (hasAnyCachedSummary) {
          detail = cachedSummary;
        }
      } catch (summaryError) {
        if (hasAnyCachedSummary) {
          // Preserve the last stored summary whenever Gemini is unavailable.
          detail = cachedSummary;
        }
        console.error("BATHROOM SUMMARY ERROR:", summaryError);
      }
    }

    return NextResponse.json({
      bathroom: {
        id: bathroom.id,
        name: bathroom.name,
        building: bathroom.building,
        floor: bathroom.floor,
        latitude: bathroom.latitude,
        longitude: bathroom.longitude,
        type: bathroom.type,
        typeLabel: formatBathroomType(bathroom.type),
        isOpen: !bathroom.is_closed,
        creatorId: bathroom.creator?.id ?? bathroom.created_by,
        creatorUsername: bathroom.creator?.username ?? null,
        createdAt,
        rating: averageRating,
        reviewCount,
        detail,
        reviews: bathroom.reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          description: review.description,
          createdAt: review.created_at,
          editedAt: review.edited_at,
          userId: review.user?.id ?? null,
          username: review.user?.username ?? "Anonymous",
          avatarUrl: review.user?.avatarUrl ?? null,
        })),
      },
    });
  } catch (error) {
    console.error("GET BATHROOM DETAIL ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch bathroom." },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { supabaseAuthId, latitude, longitude } = body as {
      supabaseAuthId?: string;
      latitude?: number;
      longitude?: number;
    };

    if (
      !supabaseAuthId ||
      !isFiniteCoordinate(latitude) ||
      !isFiniteCoordinate(longitude)
    ) {
      return NextResponse.json(
        { error: "Missing required fields (supabaseAuthId, latitude, longitude)." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabaseAuthId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const bathroom = await prisma.bathroom.findUnique({
      where: { id },
      select: {
        id: true,
        created_by: true,
      },
    });

    if (!bathroom) {
      return NextResponse.json({ error: "Bathroom not found." }, { status: 404 });
    }

    if (!bathroom.created_by || bathroom.created_by !== user.id) {
      return NextResponse.json(
        { error: "Only the restroom creator can move this pin." },
        { status: 403 },
      );
    }

    const updatedBathroom = await prisma.bathroom.update({
      where: { id: bathroom.id },
      data: {
        latitude,
        longitude,
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    });

    return NextResponse.json({ bathroom: updatedBathroom });
  } catch (error) {
    console.error("PATCH BATHROOM ERROR:", error);
    return NextResponse.json(
      { error: "Failed to update bathroom location." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { supabaseAuthId } = body as { supabaseAuthId?: string };

    if (!supabaseAuthId) {
      return NextResponse.json(
        { error: "Missing required field (supabaseAuthId)." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabaseAuthId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const bathroom = await prisma.bathroom.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        created_by: true,
        _count: {
          select: {
            reviews: true,
          },
        },
      },
    });

    if (!bathroom) {
      return NextResponse.json({ error: "Bathroom not found." }, { status: 404 });
    }

    if (!bathroom.created_by || bathroom.created_by !== user.id) {
      return NextResponse.json(
        { error: "Only the restroom creator can delete this restroom." },
        { status: 403 },
      );
    }

    await prisma.$transaction([
      prisma.review.deleteMany({
        where: { bathroom_id: bathroom.id },
      }),
      prisma.bathroom.delete({
        where: { id: bathroom.id },
      }),
    ]);

    return NextResponse.json({
      success: true,
      bathroomId: bathroom.id,
      bathroomName: bathroom.name,
      deletedReviewCount: bathroom._count.reviews,
    });
  } catch (error) {
    console.error("DELETE BATHROOM ERROR:", error);
    return NextResponse.json(
      { error: "Failed to delete bathroom." },
      { status: 500 },
    );
  }
}
