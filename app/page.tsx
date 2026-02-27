"use client";

import { useState } from "react";
import LoginForm from "./components/LoginForm";
import SignUpForm from "./components/SignUpForm";
import ToiletBG from "./components/ToiletBG";

export default function Home() {
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
 
      <ToiletBG />

      <header className="relative z-10 mt-8 w-full max-w-md rounded-xl bg-rose-100 px-4 py-2 text-center font-gasoek text-3xl text-amber-900 shadow-lg">
        PARTY POOPERS
      </header>

      <div className="relative z-10 mt-8 mb-8 w-full max-w-md">
        {showSignUp ? (
          <SignUpForm onToggle={() => setShowSignUp(false)} />
        ) : (
          <LoginForm onToggle={() => setShowSignUp(true)} />
        )}
      </div>
    </main>
  );
}
