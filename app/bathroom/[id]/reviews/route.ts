import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviews = await prisma.review.findMany({
      where: {
        bathroom_id: params.id,
      },
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(reviews);
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}