import { generateBathroomSummary, MIN_REVIEWS_FOR_AI_SUMMARY } from "@/lib/geminiBathroomSummary";
import prisma from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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
  primaryReview?: { description: string },
) {
  return (
    primaryReview?.description ||
    `${building} floor ${floor} ${formatBathroomType(type)}`
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  void request;

  try {
    const { id } = await params;

    const bathroom = await prisma.bathroom.findUnique({
      where: { id },
      include: {
        reviews: {
          orderBy: { created_at: "desc" },
          select: {
            id: true,
            rating: true,
            description: true,
            created_at: true,
            user: {
              select: {
                username: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

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
      primaryReview,
    );

    let detail = fallbackDetail;

    const canUseAiSummary = reviewCount >= MIN_REVIEWS_FOR_AI_SUMMARY;
    const hasCachedSummary =
      canUseAiSummary &&
      typeof bathroom.reviewSummary === "string" &&
      bathroom.reviewSummary.trim().length > 0 &&
      bathroom.reviewSummaryReviewCount === reviewCount;

    if (hasCachedSummary) {
      detail = bathroom.reviewSummary!.trim();
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
        }
      } catch (summaryError) {
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
        rating: averageRating,
        reviewCount,
        detail,
        reviews: bathroom.reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          description: review.description,
          createdAt: review.created_at,
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
