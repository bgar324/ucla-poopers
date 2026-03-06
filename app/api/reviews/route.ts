import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // same prisma import as your bathrooms route

export async function POST(req: Request) {
  try {
    const { userId, bathroom, review } = await req.json();

    if (!userId || !bathroom || !review) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if bathroom exists
    let existingBathroom = await prisma.bathroom.findFirst({
      where: {
        name: bathroom.name,
        building: bathroom.building,
        floor: bathroom.floor,
      },
    });

    // If not, create it
    if (!existingBathroom) {
      const bathroomData: any = { ...bathroom };
      if (userId) {
        // Check that user exists first
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (userExists) {
          bathroomData.creator = { connect: { id: userId } };
        }
      }

      existingBathroom = await prisma.bathroom.create({
        data: bathroomData,
      });
    }

    // Add review
    const newReview = await prisma.review.create({
      data: {
        rating: review.rating,
        description: review.description,
        user: { connect: { id: userId } },
        bathroom: { connect: { id: existingBathroom.id } },
      },
    });

    return NextResponse.json({ review: newReview });
  } catch (err: any) {
    console.error("ADD REVIEW ERROR:", err);
    return NextResponse.json({ error: "Failed to add review" }, { status: 500 });
  }
}