import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
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
      orderBy: [{ reviews: { _count: "desc" } }, { username: "asc" }],
    });

    return NextResponse.json({
      users: users.map(({ _count, ...user }) => ({
        ...user,
        reviewCount: _count.reviews,
      })),
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
