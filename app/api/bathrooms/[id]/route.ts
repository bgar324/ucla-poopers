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
        reviewCount: bathroom.reviews.length,
        detail:
          primaryReview?.description ??
          `${bathroom.building} floor ${bathroom.floor} ${formatBathroomType(
            bathroom.type,
          )}`,
        reviews: bathroom.reviews.map((review) => ({
          id: review.id,
          rating: review.rating,
          description: review.description,
          createdAt: review.created_at,
          username: review.user?.username ?? "Anonymous",
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
