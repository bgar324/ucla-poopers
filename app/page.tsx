"use client";

import supabase from "@/supabaseClient";
import { useEffect, useState } from "react";
import LoginForm from "./components/LoginForm";
import SignUpForm from "./components/SignUpForm";
import ToiletBG from "./components/ToiletBG";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [showSignUp, setShowSignUp] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (session) {
        router.replace("/dashboard");
        return;
      }

      setIsCheckingSession(false);
    };

    void checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          router.replace("/dashboard");
        }
      },
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
 
      <ToiletBG />

      <header className="relative z-10 mt-8 w-full max-w-md rounded-xl bg-rose-100 px-4 py-2 text-center font-gasoek text-3xl text-amber-900 shadow-lg">
        PARTY POOPERS
      </header>

      <div className="relative z-10 mt-8 mb-8 w-full max-w-md">
        {isCheckingSession ? (
          <div className="w-full bg-rose-100 rounded-xl shadow-lg p-8 text-center font-rubik text-amber-900">
            Checking session...
          </div>
        ) : showSignUp ? (
          <SignUpForm onToggle={() => setShowSignUp(false)} />
        ) : (
          <LoginForm onToggle={() => setShowSignUp(true)} />
        )}
      </div>
    </main>
  );
}
