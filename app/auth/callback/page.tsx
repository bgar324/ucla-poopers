"use client";

import { syncUserWithToken } from "@/lib/syncUser";
import supabase from "@/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function getNextPath(path: string | null): string {
  if (!path || !path.startsWith("/")) {
    return "/dashboard";
  }
  return path;
}

export default function AuthCallbackPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Finalizing sign in. Please wait...",
  );

  useEffect(() => {
    let active = true;

    const finalizeOAuth = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const nextPath = getNextPath(params.get("next"));
        const code = params.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            throw new Error(error.message);
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          throw new Error("Could not recover a valid session.");
        }

        const metadata = session.user.user_metadata ?? {};

        await syncUserWithToken(session.access_token, {
          email: session.user.email ?? undefined,
          firstName:
            typeof metadata.first_name === "string"
              ? metadata.first_name
              : typeof metadata.given_name === "string"
                ? metadata.given_name
                : undefined,
          lastName:
            typeof metadata.last_name === "string"
              ? metadata.last_name
              : typeof metadata.family_name === "string"
                ? metadata.family_name
                : undefined,
          username:
            typeof metadata.username === "string" ? metadata.username : undefined,
          avatarUrl:
            typeof metadata.avatar_url === "string"
              ? metadata.avatar_url
              : undefined,
        });

        const { data: assurance } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        const requiresMfa =
          assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2";

        if (!active) {
          return;
        }

        if (requiresMfa) {
          router.replace(`/auth/mfa?next=${encodeURIComponent(nextPath)}`);
          return;
        }

        router.replace(nextPath);
      } catch (error) {
        if (!active) {
          return;
        }
        const message =
          error instanceof Error ? error.message : "OAuth sign-in failed.";
        setStatusMessage("");
        setErrorMessage(message);
      }
    };

    void finalizeOAuth();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <main className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-rose-100 p-8 shadow-lg text-center">
        <h1 className="font-gasoek text-2xl text-amber-900">AUTH CALLBACK</h1>
        {statusMessage ? (
          <p className="mt-4 font-rubik text-amber-900">{statusMessage}</p>
        ) : null}
        {errorMessage ? (
          <p className="mt-4 font-rubik text-red-700">{errorMessage}</p>
        ) : null}
      </div>
    </main>
  );
}
