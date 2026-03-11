import prisma from "@/lib/prisma";
import { requireAuthUser } from "@/lib/supabaseServer";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type SocialListKind = "followers" | "following";

interface FollowRouteUser {
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

function mapFollowUser(user: FollowRouteUser) {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    avatarUrl: user.avatarUrl,
    reviewCount: user._count.reviews,
    followerCount: user._count.followers,
    followingCount: user._count.following,
  };
}

async function getCurrentUserId(request: NextRequest) {
  const { user } = await requireAuthUser(request);

  const currentUser = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
    select: { id: true },
  });

  if (!currentUser) {
    return null;
  }

  return currentUser.id;
}

async function getTargetUserFromBody(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as
    | { userId?: string; followingId?: string }
    | null;

  const targetUserId = body?.userId?.trim() || body?.followingId?.trim() || "";

  if (!targetUserId) {
    return { error: "Missing target user id.", targetUserId: null };
  }

  return { error: null, targetUserId };
}

function getRequestedSocialList(request: NextRequest) {
  const requestedTargetUserId =
    request.nextUrl.searchParams.get("targetUserId")?.trim() ?? "";
  const requestedList = request.nextUrl.searchParams.get("list");

  if (!requestedTargetUserId && !requestedList) {
    return null;
  }

  if (requestedList !== "followers" && requestedList !== "following") {
    return { error: "Invalid social list type.", targetUserId: null, list: null };
  }

  return {
    error: null,
    targetUserId: requestedTargetUserId,
    list: requestedList as SocialListKind,
  };
}

export async function GET(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId(request);

    if (!currentUserId) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const requestedSocialList = getRequestedSocialList(request);

    if (requestedSocialList) {
      const { error, list } = requestedSocialList;
      const targetUserId = requestedSocialList.targetUserId || currentUserId;

      if (error || !list) {
        return NextResponse.json(
          { error: error ?? "Invalid social list request." },
          { status: 400 },
        );
      }

      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "Target user not found." }, { status: 404 });
      }

      const canViewList =
        targetUserId === currentUserId ||
        Boolean(
          await prisma.follow.findUnique({
            where: {
              followerId_followingId: {
                followerId: currentUserId,
                followingId: targetUserId,
              },
            },
            select: { followerId: true },
          }),
        );

      if (!canViewList) {
        return NextResponse.json(
          { error: "Follow this user to view their followers and following." },
          { status: 403 },
        );
      }

      if (list === "followers") {
        const followers = await prisma.follow.findMany({
          where: { followingId: targetUserId },
          select: {
            follower: {
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
            },
          },
          orderBy: [
            { follower: { reviews: { _count: "desc" } } },
            { follower: { username: "asc" } },
          ],
        });

        return NextResponse.json({
          users: followers.map(({ follower }) => mapFollowUser(follower)),
        });
      }

      const following = await prisma.follow.findMany({
        where: { followerId: targetUserId },
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
                  following: true,
                  followers: true,
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
        users: following.map(({ following: followedUser }) => mapFollowUser(followedUser)),
      });
    }

    const follows = await prisma.follow.findMany({
      where: { followerId: currentUserId },
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
                following: true,
                followers: true,
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
      users: follows.map(({ following }) => mapFollowUser(following)),
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

export async function POST(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId(request);

    if (!currentUserId) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const { error, targetUserId } = await getTargetUserFromBody(request);

    if (error || !targetUserId) {
      return NextResponse.json(
        { error: error ?? "Missing target user id." },
        { status: 400 },
      );
    }

    if (targetUserId === currentUserId) {
      return NextResponse.json(
        { error: "You cannot follow yourself." },
        { status: 400 },
      );
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
      select: { followerId: true },
    });

    if (existingFollow) {
      return NextResponse.json(
        { error: "You already follow this user." },
        { status: 409 },
      );
    }

    await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to follow user.";
    const status =
      message === "Missing bearer token." || message === "Unauthorized."
        ? 401
        : 500;

    console.error("POST FOLLOW ERROR:", error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUserId = await getCurrentUserId(request);

    if (!currentUserId) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const { error, targetUserId } = await getTargetUserFromBody(request);

    if (error || !targetUserId) {
      return NextResponse.json(
        { error: error ?? "Missing target user id." },
        { status: 400 },
      );
    }

    const deleted = await prisma.follow.deleteMany({
      where: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "You do not follow this user." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to unfollow user.";
    const status =
      message === "Missing bearer token." || message === "Unauthorized."
        ? 401
        : 500;

    console.error("DELETE FOLLOW ERROR:", error);
    return NextResponse.json({ error: message }, { status });
  }
}
