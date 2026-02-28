"use client";

import { syncUserWithToken } from "@/lib/syncUser";
import supabase from "@/supabaseClient";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface LoginFormProps {
  onToggle: () => void;
}

export default function LoginForm({ onToggle }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setStatus("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (!data.session) {
        setErrorMessage("No active session returned.");
        return;
      }

      await syncUserWithToken(data.session.access_token, {
        email: data.user.email ?? email,
        firstName:
          typeof data.user.user_metadata?.first_name === "string"
            ? data.user.user_metadata.first_name
            : undefined,
        lastName:
          typeof data.user.user_metadata?.last_name === "string"
            ? data.user.user_metadata.last_name
            : undefined,
        username:
          typeof data.user.user_metadata?.username === "string"
            ? data.user.user_metadata.username
            : undefined,
        avatarUrl:
          typeof data.user.user_metadata?.avatar_url === "string"
            ? data.user.user_metadata.avatar_url
            : null,
      });

      const { data: assurance } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      const requiresMfa =
        assurance?.nextLevel === "aal2" && assurance.currentLevel !== "aal2";

      if (requiresMfa) {
        router.replace("/auth/mfa?next=/dashboard");
        return;
      }

      router.replace("/dashboard");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Login failed. Try again.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setStatus("");
    setIsLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=/dashboard`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
      },
    });

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setStatus("Redirecting to Google...");
  };

  return (
    <div className="flex flex-col items-center px-8 py-8 w-full bg-rose-100 rounded-xl shadow-lg">
      <h1 className="font-gasoek text-2xl text-amber-900 text-center">
        LOGIN TO START POOPING NOW!
      </h1>

      <form onSubmit={handleLogin} className="w-full mt-6">
        <div className="w-full">
          <label className="block text-sm text-gray-500 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="joebruin@ucla.edu"
            className="font-rubik bg-white rounded-xl w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-900"
            required
          />
        </div>

        <div className="w-full mt-6">
          <label className="block text-sm text-gray-500 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            className="font-rubik bg-white rounded-xl w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-900"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full cursor-pointer font-rubik mt-8 px-4 py-2 bg-amber-900 rounded-xl text-white shadow-lg hover:bg-amber-800 hover:-translate-y-0.5 transition duration-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "LOGGING IN..." : "LOGIN"}
        </button>

        <div className="flex items-center w-full gap-3 mt-4">
          <hr className="flex-1 border-t border-gray-400" />
          <span className="font-rubik text-gray-400 text-sm whitespace-nowrap">
            OR
          </span>
          <hr className="flex-1 border-t border-gray-400" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
          className="w-full cursor-pointer font-rubik mt-4 px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:-translate-y-0.5 transition duration-200 disabled:cursor-not-allowed disabled:opacity-70 flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.5 0 6.7 1.2 9.2 3.5l6.9-6.9C35.9 2.2 30.3 0 24 0 14.7 0 6.7 5.4 2.8 13.2l8.1 6.3C13 13.6 18.1 9.5 24 9.5z"
            />
            <path
              fill="#4285F4"
              d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.5 2.8-2.1 5.2-4.5 6.9l7.3 5.6c4.3-4 7-10 7-16.5z"
            />
            <path
              fill="#FBBC05"
              d="M10.9 28.5c-.5-1.5-.9-3-.9-4.5s.3-3.1.9-4.5l-8.1-6.3C1 16.6 0 20.2 0 24s1 7.4 2.8 10.8l8.1-6.3z"
            />
            <path
              fill="#34A853"
              d="M24 48c6.3 0 11.6-2.1 15.4-5.7l-7.3-5.6c-2 1.4-4.7 2.3-8.1 2.3-5.9 0-10.9-4-12.7-9.5l-8.1 6.3C6.7 42.6 14.7 48 24 48z"
            />
          </svg>
          LOGIN WITH GOOGLE
        </button>

        {status ? (
          <p className="font-rubik mt-4 text-sm text-amber-800 text-center">
            {status}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="font-rubik mt-4 text-sm text-red-700 text-center">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onToggle}
          className="w-full cursor-pointer font-rubik mt-6 px-4 py-2 bg-amber-900 rounded-xl text-white shadow-lg hover:bg-amber-800 hover:-translate-y-0.5 transition"
        >
          SIGN UP
        </button>
      </form>
    </div>
  );
}
