"use client";

import supabase from "@/supabaseClient";
import { BADGE_META } from "@/lib/badges";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import ToiletBG from "../components/ToiletBG";
import Navbar from "../components/Navbar";
import Avatar from "../components/UserAvatar";
import AvatarCropModal from "../components/AvatarCropModal";

interface ProfileRecord {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
}

interface EnrollmentState {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function buildAvatarPath(userId: string, file: File) {
  const rawExtension = file.name.split(".").pop()?.toLowerCase();
  const extension =
    rawExtension && /^[a-z0-9]+$/.test(rawExtension) ? rawExtension : "jpg";
  const baseName =
    file.name
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "avatar";

  return `${userId}/${crypto.randomUUID()}-${baseName}.${extension}`;
}

function extractAvatarStoragePath(avatarUrl: string | null) {
  if (!avatarUrl) {
    return null;
  }

  try {
    const url = new URL(avatarUrl);
    const prefix = `/storage/v1/object/public/${AVATAR_BUCKET}/`;
    const start = url.pathname.indexOf(prefix);

    if (start === -1) {
      return null;
    }

    return decodeURIComponent(url.pathname.slice(start + prefix.length));
  } catch {
    return null;
  }
}

export default function ProfilePage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [sessionUserId, setSessionUserId] = useState("");
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [pendingAvatarFile, setPendingAvatarFile] = useState<File | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [badges, setBadges] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isMfaEnabled, setIsMfaEnabled] = useState(false);
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaMessage, setMfaMessage] = useState("");
  const [mfaError, setMfaError] = useState("");
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null);

  const loadMfaState = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();

    if (error) {
      setMfaError(error.message);
      return;
    }

    const verifiedFactor = data.totp.find(
      (factor) => factor.status === "verified",
    );
    setVerifiedFactorId(verifiedFactor?.id ?? null);
    setIsMfaEnabled(Boolean(verifiedFactor));
  };

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/");
        return;
      }

      if (!active) {
        return;
      }

      setAccessToken(session.access_token);
      setSessionUserId(session.user.id);

      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setErrorMessage(data?.error ?? "Failed to load profile.");
        setIsLoading(false);
        return;
      }

      const data = (await response.json()) as { user: ProfileRecord };

      if (!active) {
        return;
      }

      setProfile(data.user);
      setFirstName(data.user.firstName);
      setLastName(data.user.lastName);
      setUsername(data.user.username);

      const { data: badgeData } = await supabase
  .from("badges")
  .select("badge_type")
  .eq("user_id", session.user.id);
setBadges((badgeData ?? []).map((b: { badge_type: string }) => b.badge_type));

      await loadMfaState();

      setIsLoading(false);
    };

    void loadProfile();

    return () => {
      active = false;
    };
  }, [router]);

  const updateProfile = async (updates: Partial<ProfileRecord>) => {
    if (!accessToken) {
      throw new Error("No valid auth session.");
    }

    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    const responseData = (await response.json()) as
      | { user: ProfileRecord }
      | { error: string };

    if (!response.ok || !("user" in responseData)) {
      const message =
        "error" in responseData ? responseData.error : "Profile update failed.";
      throw new Error(message);
    }

    setProfile(responseData.user);
    return responseData.user;
  };

  const uploadAvatarFile = async (file: File) => {
    if (!sessionUserId) {
      throw new Error("No valid auth session.");
    }

    const previousAvatarUrl = profile?.avatarUrl ?? null;
    const nextAvatarPath = buildAvatarPath(sessionUserId, file);

    setStatusMessage("");
    setErrorMessage("");
    setIsUploadingAvatar(true);

    try {
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(nextAvatarPath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(nextAvatarPath);

      await updateProfile({ avatarUrl: publicUrl });
      setStatusMessage("Profile photo updated.");

      const previousAvatarPath = extractAvatarStoragePath(previousAvatarUrl);
      if (previousAvatarPath && previousAvatarPath !== nextAvatarPath) {
        void supabase.storage.from(AVATAR_BUCKET).remove([previousAvatarPath]);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Profile photo upload failed.";

      void supabase.storage.from(AVATAR_BUCKET).remove([nextAvatarPath]);
      setErrorMessage(message);
      throw error;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!sessionUserId) {
      setErrorMessage("No valid auth session.");
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setErrorMessage("Please upload a PNG, JPG, or WEBP image.");
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      setErrorMessage("Profile photos must be 5MB or smaller.");
      return;
    }

    setStatusMessage("");
    setErrorMessage("");
    setPendingAvatarFile(file);
  };

  const handleConfirmAvatarCrop = async (croppedFile: File) => {
    await uploadAvatarFile(croppedFile);
    setPendingAvatarFile(null);
  };

  const handleRemoveAvatar = async () => {
    const currentAvatarUrl = profile?.avatarUrl ?? null;
    if (!currentAvatarUrl) {
      return;
    }

    setStatusMessage("");
    setErrorMessage("");
    setIsUploadingAvatar(true);

    try {
      await updateProfile({ avatarUrl: null });
      setStatusMessage("Profile photo removed.");

      const currentAvatarPath = extractAvatarStoragePath(currentAvatarUrl);
      if (currentAvatarPath) {
        void supabase.storage.from(AVATAR_BUCKET).remove([currentAvatarPath]);
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Profile photo removal failed.";
      setErrorMessage(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage("");
    setErrorMessage("");
    setIsSaving(true);

    try {
      await updateProfile({
        firstName,
        lastName,
        username,
      });

      setStatusMessage("Profile updated.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Profile update failed.";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnableMfa = async () => {
    setMfaMessage("");
    setMfaError("");
    setIsMfaLoading(true);

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Party Poopers",
    });

    if (error) {
      setMfaError(error.message);
      setIsMfaLoading(false);
      return;
    }

    setEnrollment({
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });
    setMfaMessage("Scan the QR code and enter a 6-digit code to verify.");
    setIsMfaLoading(false);
  };

  const handleVerifyMfa = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!enrollment) {
      return;
    }

    setMfaMessage("");
    setMfaError("");
    setIsMfaLoading(true);

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.factorId,
      code: mfaCode,
    });

    if (error) {
      setMfaError(error.message);
      setIsMfaLoading(false);
      return;
    }

    try {
      await updateProfile({ twoFactorEnabled: true });
    } catch {
      // The source of truth is Supabase factors; profile sync is best-effort.
    }

    setEnrollment(null);
    setMfaCode("");
    setMfaMessage("2FA is enabled.");
    setIsMfaLoading(false);
    await loadMfaState();
  };

  const handleDisableMfa = async () => {
    if (!verifiedFactorId) {
      return;
    }

    setMfaMessage("");
    setMfaError("");
    setIsMfaLoading(true);

    const { error } = await supabase.auth.mfa.unenroll({
      factorId: verifiedFactorId,
    });

    if (error) {
      setMfaError(error.message);
      setIsMfaLoading(false);
      return;
    }

    try {
      await updateProfile({ twoFactorEnabled: false });
    } catch {
      // The source of truth is Supabase factors; profile sync is best-effort.
    }

    setEnrollment(null);
    setMfaCode("");
    setMfaMessage("2FA has been disabled.");
    setIsMfaLoading(false);
    await loadMfaState();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
        <div className="w-full max-w-2xl rounded-xl bg-rose-100 p-8 shadow-lg text-center font-rubik text-amber-900">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <>
      {pendingAvatarFile ? (
        <AvatarCropModal
          file={pendingAvatarFile}
          isSubmitting={isUploadingAvatar}
          onCancel={() => {
            if (!isUploadingAvatar) {
              setPendingAvatarFile(null);
            }
          }}
          onConfirm={handleConfirmAvatarCrop}
        />
      ) : null}

      <Navbar />
      <main className="min-h-screen bg-amber-50 px-4 py-10">
        <ToiletBG />
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <section className="rounded-xl bg-rose-100 p-8 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <h1 className="font-gasoek text-3xl text-amber-900">PROFILE</h1>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="font-rubik cursor-pointer rounded-xl border border-amber-900 px-4 py-2 text-amber-900 hover:bg-amber-100 transition"
              >
                Dashboard
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-xl border border-amber-900/10 bg-white/70 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <Avatar size={96} src={profile?.avatarUrl ?? undefined} />
                <div>
                  <p className="font-rubik text-lg text-amber-900">
                    Profile Photo
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <label
                  className={`font-rubik rounded-xl bg-amber-900 px-5 py-2 text-white shadow-md transition ${
                    isUploadingAvatar
                      ? "cursor-not-allowed opacity-70"
                      : "cursor-pointer hover:bg-amber-800"
                  }`}
                >
                  {isUploadingAvatar
                    ? "Uploading..."
                    : profile?.avatarUrl
                      ? "Change Photo"
                      : "Upload Photo"}
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleAvatarChange}
                    disabled={isUploadingAvatar}
                  />
                </label>

                {profile?.avatarUrl ? (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    disabled={isUploadingAvatar}
                    className="font-rubik cursor-pointer rounded-xl border border-amber-900 px-5 py-2 text-amber-900 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Remove Photo
                  </button>
                ) : null}
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={profile?.email ?? ""}
                    disabled
                    className="w-full rounded-xl border border-gray-200 bg-gray-100 px-4 py-2 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900"
                    minLength={3}
                    maxLength={24}
                    required
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="font-rubik cursor-pointer rounded-xl bg-amber-900 px-5 py-2 text-white shadow-md hover:bg-amber-800 transition disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isSaving ? "Saving..." : "Save Profile"}
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="font-rubik cursor-pointer rounded-xl border border-amber-900 px-5 py-2 text-amber-900 hover:bg-amber-100 transition"
                >
                  Sign Out
                </button>
              </div>
            </form>

            {statusMessage ? (
              <p className="mt-4 font-rubik text-sm text-amber-800">
                {statusMessage}
              </p>
            ) : null}
            {errorMessage ? (
              <p className="mt-4 font-rubik text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}
          </section>

          <section className="rounded-xl bg-rose-100 p-8 shadow-lg">
            <h2 className="font-gasoek text-2xl text-amber-900">BADGES</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {badges.length === 0 ? (
                <p className="font-rubik text-sm text-gray-500">No badges yet. Start reviewing!</p>
              ) : (
                badges.map((badge) => (
                  <div key={badge} className="relative group flex items-center gap-2 rounded-xl bg-amber-900 px-4 py-2 text-white font-rubik text-sm shadow cursor-default">
                    <span>{BADGE_META[badge]?.emoji ?? "🏅"}</span>
                    <span>{BADGE_META[badge]?.label ?? badge}</span>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 rounded-xl bg-white text-amber-900 text-xs px-3 py-2 shadow-lg border border-amber-900/10 text-center z-50">
                      {BADGE_META[badge]?.description ?? badge}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-xl bg-rose-100 p-8 shadow-lg">
            <h2 className="font-gasoek text-2xl text-amber-900">
              TWO-FACTOR AUTHENTICATION
            </h2>
            <p className="mt-2 font-rubik text-sm text-gray-700">
              Status: {isMfaEnabled ? "Enabled" : "Disabled"}
            </p>

            {!isMfaEnabled && !enrollment ? (
              <button
                type="button"
                onClick={handleEnableMfa}
                disabled={isMfaLoading}
                className="mt-4 font-rubik cursor-pointer rounded-xl bg-amber-900 px-5 py-2 text-white shadow-md hover:bg-amber-800 transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isMfaLoading ? "Generating..." : "Enable 2FA"}
              </button>
            ) : null}

            {enrollment ? (
              <div className="mt-6 space-y-4">
                <div className="rounded-xl border border-amber-200 bg-white p-4">
                  <p className="font-rubik text-sm text-gray-700 mb-3">
                    Scan this QR code in Google Authenticator/Authy.
                  </p>
                  <div
                    className="inline-block rounded-lg border border-gray-200 bg-white p-3"
                    dangerouslySetInnerHTML={{ __html: enrollment.qrCode }}
                  />
                  <p className="mt-3 font-rubik text-xs text-gray-500 break-all">
                    Secret: {enrollment.secret}
                  </p>
                  <p className="mt-1 font-rubik text-xs text-gray-500 break-all">
                    URI: {enrollment.uri}
                  </p>
                </div>

                <form onSubmit={handleVerifyMfa} className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">
                      Enter 6-digit code
                    </label>
                    <input
                      type="text"
                      value={mfaCode}
                      onChange={(event) =>
                        setMfaCode(
                          event.target.value.replace(/\D/g, "").slice(0, 6),
                        )
                      }
                      placeholder="123456"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-900"
                      inputMode="numeric"
                      pattern="\d{6}"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isMfaLoading}
                    className="font-rubik cursor-pointer rounded-xl bg-amber-900 px-5 py-2 text-white shadow-md hover:bg-amber-800 transition disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isMfaLoading ? "Verifying..." : "Verify & Activate 2FA"}
                  </button>
                </form>
              </div>
            ) : null}

            {isMfaEnabled ? (
              <button
                type="button"
                onClick={handleDisableMfa}
                disabled={isMfaLoading}
                className="mt-4 font-rubik cursor-pointer rounded-xl border border-red-400 px-5 py-2 text-red-600 hover:bg-red-50 transition disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isMfaLoading ? "Updating..." : "Disable 2FA"}
              </button>
            ) : null}

            {mfaMessage ? (
              <p className="mt-4 font-rubik text-sm text-amber-800">
                {mfaMessage}
              </p>
            ) : null}
            {mfaError ? (
              <p className="mt-4 font-rubik text-sm text-red-700">{mfaError}</p>
            ) : null}
          </section>
        </div>
      </main>
    </>
  );
}
