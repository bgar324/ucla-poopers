"use client";

import { syncCurrentSessionUser } from "@/lib/syncUser";
import supabase from "@/supabaseClient";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

function getNextPath(path: string | null): string {
  if (!path || !path.startsWith("/")) {
    return "/dashboard";
  }
  return path;
}

export default function MfaPage() {
  const router = useRouter();
  const [nextPath, setNextPath] = useState("/dashboard");

  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadFactor = async () => {
      const params = new URLSearchParams(window.location.search);
      setNextPath(getNextPath(params.get("next")));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.replace("/");
        return;
      }

      const { data, error } = await supabase.auth.mfa.listFactors();

      if (!active) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setIsLoading(false);
        return;
      }

      const verifiedTotpFactor = data.totp.find(
        (factor) => factor.status === "verified",
      );

      if (!verifiedTotpFactor) {
        setErrorMessage(
          "No verified 2FA factor is available. Enable 2FA in your profile first.",
        );
        setIsLoading(false);
        return;
      }

      setFactorId(verifiedTotpFactor.id);
      setIsLoading(false);
    };

    void loadFactor();

    return () => {
      active = false;
    };
  }, [router]);

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!factorId) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    await syncCurrentSessionUser({ twoFactorEnabled: true }).catch(() => null);
    router.replace(nextPath);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-rose-100 p-8 shadow-lg">
        <h1 className="font-gasoek text-2xl text-amber-900 text-center">
          TWO-FACTOR CHECK
        </h1>
        <p className="mt-3 font-rubik text-sm text-gray-700 text-center">
          Enter the 6-digit code from your authenticator app.
        </p>

        {isLoading ? (
          <p className="mt-6 font-rubik text-center text-amber-900">Loading...</p>
        ) : (
          <form onSubmit={handleVerify} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-500 mb-1">
                Authenticator Code
              </label>
              <input
                type="text"
                value={code}
                onChange={(event) =>
                  setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                placeholder="123456"
                className="font-rubik bg-white rounded-xl w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-900"
                inputMode="numeric"
                pattern="\d{6}"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full cursor-pointer font-rubik px-4 py-2 bg-amber-900 rounded-xl text-white shadow-lg hover:bg-amber-800 hover:-translate-y-0.5 transition duration-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "VERIFYING..." : "VERIFY CODE"}
            </button>
          </form>
        )}

        {errorMessage ? (
          <p className="mt-4 font-rubik text-sm text-red-700 text-center">
            {errorMessage}
          </p>
        ) : null}
      </div>
    </main>
  );
}
