import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface UserListRouteUser {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  _count: {
    reviews: number;
    following: number;
    followers: number;
  };
}

export async function GET() {
  try {
    const users = (await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        _count: {
          select: {
            reviews: true,
            following: true,
            followers: true,
          },
        },
      },
      orderBy: [{ reviews: { _count: "desc" } }, { username: "asc" }],
    })) as UserListRouteUser[];

    return NextResponse.json({
      users: users.map(({ _count, ...user }) => ({
        ...user,
        reviewCount: _count.reviews,
        followingCount: _count.following,
        followerCount: _count.followers,
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
