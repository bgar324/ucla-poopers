import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function formatBathroomType(type: string): string {
  switch (type) {
    case "gender-neutral":
      return "Gender Neutral";
    case "accessible":
      return "Accessible";
    default:
      return "Standard";
  }
}

function getAverageRating(ratings: number[]): number {
  if (ratings.length === 0) {
    return 0;
  }

  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

export async function GET() {
  try {
    const bathrooms = await prisma.bathroom.findMany({
      orderBy: [{ building: "asc" }, { floor: "asc" }],
      include: {
        reviews: {
          orderBy: { created_at: "asc" },
          select: {
            rating: true,
            description: true,
          },
        },
      },
    });

    const spots = bathrooms.map((bathroom) => {
      const ratings = bathroom.reviews.map((review) => review.rating);
      const averageRating = getAverageRating(ratings);
      const primaryReview = bathroom.reviews[0];

      return {
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
          `${bathroom.building} floor ${bathroom.floor} ${formatBathroomType(bathroom.type)}`,
      };
    });

    return NextResponse.json({ bathrooms: spots });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load bathrooms.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
