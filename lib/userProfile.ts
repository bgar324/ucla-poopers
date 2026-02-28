import type { User as SupabaseUser } from "@supabase/supabase-js";

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 24;

function toTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const pieces = fullName
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (pieces.length === 0) {
    return { firstName: "Bruin", lastName: "User" };
  }

  if (pieces.length === 1) {
    return { firstName: pieces[0], lastName: "User" };
  }

  return {
    firstName: pieces[0],
    lastName: pieces.slice(1).join(" "),
  };
}

export function normalizeUsername(input: string): string {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (normalized.length >= USERNAME_MIN_LENGTH) {
    return normalized.slice(0, USERNAME_MAX_LENGTH);
  }

  const padded = `${normalized}bruinuser`;
  return padded.slice(0, USERNAME_MAX_LENGTH);
}

export function baseUsernameFromUser(user: SupabaseUser): string {
  const metadata = user.user_metadata ?? {};
  const usernameFromMetadata = toTrimmedString(metadata.username);
  if (usernameFromMetadata) {
    return normalizeUsername(usernameFromMetadata);
  }

  if (user.email) {
    return normalizeUsername(user.email.split("@")[0] ?? user.id.slice(0, 8));
  }

  return normalizeUsername(user.id.slice(0, 8));
}

export function namesFromUser(user: SupabaseUser): {
  firstName: string;
  lastName: string;
} {
  const metadata = user.user_metadata ?? {};

  const firstName =
    toTrimmedString(metadata.first_name) ??
    toTrimmedString(metadata.given_name);
  const lastName =
    toTrimmedString(metadata.last_name) ??
    toTrimmedString(metadata.family_name);

  if (firstName && lastName) {
    return { firstName, lastName };
  }

  const fullName =
    toTrimmedString(metadata.full_name) ?? toTrimmedString(metadata.name);
  if (fullName) {
    return splitFullName(fullName);
  }

  return {
    firstName: firstName ?? "Bruin",
    lastName: lastName ?? "User",
  };
}

export function safeProfileString(input: unknown, fallback: string): string {
  const trimmed = toTrimmedString(input);
  return trimmed ?? fallback;
}

export function parseOptionalBoolean(input: unknown): boolean | undefined {
  if (typeof input === "boolean") {
    return input;
  }
  return undefined;
}
