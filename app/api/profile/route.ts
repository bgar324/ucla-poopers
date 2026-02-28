import prisma from "@/lib/prisma";
import { requireAuthUser } from "@/lib/supabaseServer";
import {
  baseUsernameFromUser,
  namesFromUser,
  normalizeUsername,
  parseOptionalBoolean,
  safeProfileString,
} from "@/lib/userProfile";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

interface UpdateProfileBody {
  firstName?: string;
  lastName?: string;
  username?: string;
  twoFactorEnabled?: boolean;
}

async function ensureUserRecord(request: NextRequest) {
  const { user } = await requireAuthUser(request);

  let profile = await prisma.user.findUnique({
    where: { supabaseAuthId: user.id },
  });

  if (!profile) {
    const names = namesFromUser(user);
    const baseUsername = baseUsernameFromUser(user);
    let username = normalizeUsername(baseUsername);
    let suffix = 0;

    while (suffix < 100) {
      const exists = await prisma.user.findUnique({
        where: { username },
        select: { id: true },
      });

      if (!exists) {
        break;
      }

      suffix += 1;
      username = `${baseUsername.slice(0, 20)}_${suffix}`;
    }

    profile = await prisma.user.create({
      data: {
        supabaseAuthId: user.id,
        email: user.email ?? "",
        username,
        firstName: names.firstName,
        lastName: names.lastName,
        avatarUrl:
          typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : null,
      },
    });
  }

  return { user, profile };
}

export async function GET(request: NextRequest) {
  try {
    const { profile } = await ensureUserRecord(request);
    return NextResponse.json({ user: profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized.";
    const status = message === "Unauthorized." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { profile } = await ensureUserRecord(request);

    const body = (await request.json().catch(() => ({}))) as UpdateProfileBody;
    const nextFirstName = safeProfileString(body.firstName, profile.firstName);
    const nextLastName = safeProfileString(body.lastName, profile.lastName);
    const requestedUsername = safeProfileString(body.username, profile.username);
    const nextUsername = normalizeUsername(requestedUsername);

    if (nextUsername.length < 3 || nextUsername.length > 24) {
      return NextResponse.json(
        { error: "Username must be between 3 and 24 characters." },
        { status: 400 },
      );
    }

    const usernameOwner = await prisma.user.findUnique({
      where: { username: nextUsername },
      select: { id: true },
    });

    if (usernameOwner && usernameOwner.id !== profile.id) {
      return NextResponse.json(
        { error: "That username is already taken." },
        { status: 409 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: profile.id },
      data: {
        firstName: nextFirstName,
        lastName: nextLastName,
        username: nextUsername,
        twoFactorEnabled:
          parseOptionalBoolean(body.twoFactorEnabled) ?? profile.twoFactorEnabled,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed.";
    const status = message === "Unauthorized." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
