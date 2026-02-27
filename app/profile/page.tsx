"use client";

import supabase from "@/supabaseClient";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import ToiletBG from "../components/ToiletBG";

interface ProfileRecord {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  twoFactorEnabled: boolean;
}

interface EnrollmentState {
  factorId: string;
  qrCode: string;
  secret: string;
  uri: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState("");
  const [profile, setProfile] = useState<ProfileRecord | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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

    const verifiedFactor = data.totp.find((factor) => factor.status === "verified");
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

      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
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
                <label className="block text-sm text-gray-600 mb-1">Email</label>
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
            <p className="mt-4 font-rubik text-sm text-red-700">{errorMessage}</p>
          ) : null}
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
                      setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))
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
            <p className="mt-4 font-rubik text-sm text-amber-800">{mfaMessage}</p>
          ) : null}
          {mfaError ? (
            <p className="mt-4 font-rubik text-sm text-red-700">{mfaError}</p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
