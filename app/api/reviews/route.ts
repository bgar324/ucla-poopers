import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

//add review to existing bathroom or create a new one
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supabaseAuthId, bathroomId, bathroom, review } = body;

    if (!supabaseAuthId || !review) {
      return NextResponse.json(
        { error: "Missing required fields (supabaseAuthId, review)" },
        { status: 400 }
      );
    }

    if (!bathroomId && !bathroom) {
      return NextResponse.json(
        { error: "Provide either bathroomId or bathroom (new bathroom data)" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabaseAuthId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let targetBathroom;

    if (bathroomId) {
      targetBathroom = await prisma.bathroom.findUnique({
        where: { id: bathroomId },
      });
      if (!targetBathroom) {
        return NextResponse.json({ error: "Bathroom not found" }, { status: 404 });
      }
    } else {
      const { name, building, floor, latitude, longitude, type } = bathroom;
      if (!name || !building || floor === undefined || !latitude || !longitude || !type) {
        return NextResponse.json(
          { error: "New bathroom requires name, building, floor, latitude, longitude, type" },
          { status: 400 }
        );
      }
      targetBathroom = await prisma.bathroom.create({
        data: {
          name,
          building,
          floor: Number(floor),
          latitude: Number(latitude),
          longitude: Number(longitude),
          type,
          created_by: user.id,
        },
      });
    }

    const existingReview = await prisma.review.findFirst({
      where: {
        bathroom_id: targetBathroom.id,
        user_id: user.id,
      },
      select: { id: true },
    });

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already rated this bathroom." },
        { status: 409 },
      );
    }

    const newReview = await prisma.review.create({
      data: {
        rating: Number(review.rating),
        description: review.description ?? "",
        user_id: user.id,
        bathroom_id: targetBathroom.id,
      },
    });

    return NextResponse.json({ review: newReview });
  } catch (err: unknown) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const uniqueTarget = err.meta?.target;
      const isBathroomUserUnique =
        (Array.isArray(uniqueTarget) &&
          uniqueTarget.includes("bathroom_id") &&
          uniqueTarget.includes("user_id")) ||
        (typeof uniqueTarget === "string" &&
          uniqueTarget.includes("bathroom_id") &&
          uniqueTarget.includes("user_id"));

      if (isBathroomUserUnique) {
        return NextResponse.json(
          { error: "You have already rated this bathroom." },
          { status: 409 },
        );
      }
    }

    console.error("ADD REVIEW ERROR:", err);
    return NextResponse.json({ error: "Failed to add review" }, { status: 500 });
  }
}

//get all reviews
export async function GET() {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { created_at: "desc" },
      include: {
        user: { select: { username: true } },
        bathroom: {
          select: {
            id: true,
            name: true,
            building: true,
            floor: true,
            type: true,
          },
        },
      },
    });
    return NextResponse.json({ reviews });
  } catch (err: unknown) {
    console.error("GET REVIEWS ERROR:", err);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}
