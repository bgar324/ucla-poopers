import supabase from "@/supabaseClient";

export interface SyncUserPayload {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  avatarUrl?: string | null;
  twoFactorEnabled?: boolean;
}

export async function syncUserWithToken(
  accessToken: string,
  payload: SyncUserPayload = {},
) {
  const response = await fetch("/api/auth/sync-user", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(data?.error ?? "Failed to sync user profile.");
  }

  return response.json();
}

export async function syncCurrentSessionUser(payload: SyncUserPayload = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return null;
  }

  return syncUserWithToken(session.access_token, payload);
}
