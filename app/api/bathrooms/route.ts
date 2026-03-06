import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

function isUuidLike(value: string): boolean {
  return /^[0-9a-fA-F-]{36}$/.test(value);
}

// Helper to format bathroom types
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

// Helper to calculate average rating
function getAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, rating) => sum + rating, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

// POST — add a new bathroom
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, building, floor, latitude, longitude, type } = body;

    if (!name || !building || floor === undefined || !latitude || !longitude || !type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const bathroom = await prisma.bathroom.create({
      data: {
        name,
        building,
        floor: Number(floor),
        latitude: Number(latitude),
        longitude: Number(longitude),
        type,
      },
    });

    return NextResponse.json(bathroom, { status: 201 });
  } catch (error) {
    console.error("CREATE BATHROOM ERROR:", error);
    return NextResponse.json({ error: "Failed to create bathroom" }, { status: 500 });
  }
}

// GET — fetch bathrooms with optional filters and formatted response
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const building = searchParams.get("building");
    const floor = searchParams.get("floor");
    const supabaseAuthId = searchParams.get("supabaseAuthId");

    let excludeReviewedByUserId: string | null = null;
    if (supabaseAuthId && isUuidLike(supabaseAuthId)) {
      const user = await prisma.user.findUnique({
        where: { supabaseAuthId },
        select: { id: true },
      });
      excludeReviewedByUserId = user?.id ?? null;
    }

    const bathrooms = await prisma.bathroom.findMany({
      where: {
        ...(type && { type }),
        ...(building && { building }),
        ...(floor && { floor: Number(floor) }),
        ...(excludeReviewedByUserId && {
          reviews: {
            none: {
              user_id: excludeReviewedByUserId,
            },
          },
        }),
      },
      orderBy: [{ building: "asc" }, { floor: "asc" }],
      include: {
        reviews: {
          orderBy: { created_at: "asc" },
          select: { rating: true, description: true },
        },
      },
    });

    // Format response
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
    console.error("GET BATHROOMS ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch bathrooms" }, { status: 500 });
  }
}
