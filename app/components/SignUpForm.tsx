"use client";

import {
  buildAuthCallbackUrl,
  DEFAULT_POST_AUTH_PATH,
} from "@/lib/authRedirect";
import { syncUserWithToken } from "@/lib/syncUser";
import supabase from "@/supabaseClient";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface SignUpFormProps {
  onToggle: () => void;
}

export default function SignUpForm({ onToggle }: SignUpFormProps) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setStatus("");

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl(),
          data: {
            first_name: firstName,
            last_name: lastName,
            username,
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session?.access_token) {
        await syncUserWithToken(data.session.access_token, {
          firstName,
          lastName,
          username,
          email,
          twoFactorEnabled: false,
        });
        router.replace(DEFAULT_POST_AUTH_PATH);
        return;
      }

      setStatus("Check your inbox to confirm your account, then log in.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sign up failed. Try again.";
      setErrorMessage(message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignUp = async () => {
    setErrorMessage("");
    setStatus("");
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: buildAuthCallbackUrl(),
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
    <div className="w-full bg-rose-100 rounded-xl shadow-lg p-8">
      <form onSubmit={handleSignUp} className="flex flex-col space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-gasoek text-amber-900">
            SIGN UP TO START POOPING NOW!
          </h1>
        </div>

        <div className="flex flex-row gap-2">
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="Joe"
              className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-900 transition"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Bruin"
              className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-900 transition"
              required
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="joebruin@ucla.edu"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-900 transition"
            required
          />
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="pooperking_joe"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-900 transition"
            minLength={3}
            maxLength={24}
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 8 characters"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-900 transition"
            minLength={8}
            required
          />
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm text-gray-500 mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter your password"
            className="w-full px-4 py-2 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-900 transition"
            minLength={8}
            required
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading}
          className="cursor-pointer w-full py-2 bg-amber-900 text-white rounded-xl shadow-md hover:bg-amber-800 hover:-translate-y-0.5 transition duration-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "CREATING ACCOUNT..." : "SIGN UP"}
        </button>

        <div className="flex items-center w-full gap-3">
          <hr className="flex-1 border-t border-gray-400" />
          <span className="font-rubik text-gray-400 text-sm whitespace-nowrap">
            OR
          </span>
          <hr className="flex-1 border-t border-gray-400" />
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isLoading}
          className="cursor-pointer w-full py-2 rounded-xl border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 hover:-translate-y-0.5 transition duration-200 flex items-center justify-center gap-2"
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
          <span className="font-rubik">SIGN IN WITH GOOGLE</span>
        </button>

        {status ? (
          <p className="font-rubik text-sm text-amber-800 text-center">
            {status}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="font-rubik text-sm text-red-700 text-center">
            {errorMessage}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onToggle}
          className="cursor-pointer text-sm text-gray-500 hover:text-amber-900 transition"
        >
          Already have an account? <span className="underline">Login</span>
        </button>
      </form>
    </div>
  );
}
