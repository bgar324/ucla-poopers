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

interface SyncUserBody {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  avatarUrl?: string | null;
  twoFactorEnabled?: boolean;
}

async function resolveUniqueUsername(
  requestedUsername: string,
  existingUserId?: string,
): Promise<string> {
  const normalizedBase = normalizeUsername(requestedUsername);
  let candidate = normalizedBase;
  let suffix = 0;

  while (suffix < 100) {
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });

    if (!existing || existing.id === existingUserId) {
      return candidate;
    }

    suffix += 1;
    candidate = `${normalizedBase.slice(0, 20)}_${suffix}`;
  }

  return `${normalizedBase.slice(0, 18)}_${Date.now().toString().slice(-4)}`;
}

export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuthUser(request);

    const body = (await request.json().catch(() => ({}))) as SyncUserBody;
    const defaultNames = namesFromUser(user);

    const existing = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: {
        id: true,
        username: true,
        twoFactorEnabled: true,
        firstName: true,
        lastName: true,
      },
    });

    const requestedUsername =
      body.username ??
      existing?.username ??
      (user.user_metadata?.username as string | undefined) ??
      baseUsernameFromUser(user);

    const username = await resolveUniqueUsername(requestedUsername, existing?.id);

    const profile = await prisma.user.upsert({
      where: { supabaseAuthId: user.id },
      update: {
        email: safeProfileString(body.email, user.email ?? ""),
        firstName: safeProfileString(
          body.firstName,
          existing?.firstName ?? defaultNames.firstName,
        ),
        lastName: safeProfileString(
          body.lastName,
          existing?.lastName ?? defaultNames.lastName,
        ),
        avatarUrl:
          body.avatarUrl ??
          (typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : null),
        username,
        twoFactorEnabled:
          parseOptionalBoolean(body.twoFactorEnabled) ??
          existing?.twoFactorEnabled ??
          false,
      },
      create: {
        supabaseAuthId: user.id,
        email: safeProfileString(body.email, user.email ?? ""),
        username,
        firstName: safeProfileString(body.firstName, defaultNames.firstName),
        lastName: safeProfileString(body.lastName, defaultNames.lastName),
        avatarUrl:
          body.avatarUrl ??
          (typeof user.user_metadata?.avatar_url === "string"
            ? user.user_metadata.avatar_url
            : null),
        twoFactorEnabled: parseOptionalBoolean(body.twoFactorEnabled) ?? false,
      },
    });

    return NextResponse.json({ user: profile });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to sync user profile.";
    const status = message === "Unauthorized." ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
