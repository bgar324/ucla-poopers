import prisma from "@/lib/prisma";
import { requireAuthUser } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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
      select: {
        following: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: [
        { following: { reviews: { _count: "desc" } } },
        { following: { username: "asc" } },
      ],
    });

    return NextResponse.json({
      users: follows.map(({ following }) => ({
        id: following.id,
        username: following.username,
        firstName: following.firstName,
        lastName: following.lastName,
        avatarUrl: following.avatarUrl,
        reviewCount: following._count.reviews,
      })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch follows.";
    const status =
      message === "Missing bearer token." || message === "Unauthorized."
        ? 401
        : 500;

    console.error("GET FOLLOW ERROR:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
