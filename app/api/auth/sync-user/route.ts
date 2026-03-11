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

const AVATAR_STORAGE_PATH_SEGMENT = "/storage/v1/object/public/avatars/";

function normalizeIncomingAvatarUrl(value: string | null | undefined) {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function isManagedAvatarUrl(value: string | null | undefined) {
  if (!value) {
    return false;
  }

  return value.includes(AVATAR_STORAGE_PATH_SEGMENT);
}

function resolveSyncedAvatarUrl(
  existingAvatarUrl: string | null | undefined,
  incomingAvatarUrl: string | undefined,
) {
  if (isManagedAvatarUrl(existingAvatarUrl)) {
    return existingAvatarUrl ?? null;
  }

  if (incomingAvatarUrl) {
    return incomingAvatarUrl;
  }

  return existingAvatarUrl ?? null;
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
    const metadataAvatarUrl = normalizeIncomingAvatarUrl(
      typeof user.user_metadata?.avatar_url === "string"
        ? user.user_metadata.avatar_url
        : undefined,
    );
    const requestedAvatarUrl = normalizeIncomingAvatarUrl(body.avatarUrl);

    const existing = await prisma.user.findUnique({
      where: { supabaseAuthId: user.id },
      select: {
        id: true,
        username: true,
        twoFactorEnabled: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
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
        avatarUrl: resolveSyncedAvatarUrl(
          existing?.avatarUrl,
          requestedAvatarUrl ?? metadataAvatarUrl,
        ),
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
        avatarUrl: requestedAvatarUrl ?? metadataAvatarUrl ?? null,
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
