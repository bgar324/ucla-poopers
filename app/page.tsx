"use client";

import { useState } from "react";
import LoginForm from "./components/LoginForm";
import SignUpForm from "./components/SignUpForm";

export default function Home() {
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <main className="flex justify-center items-center min-h-screen flex-col px-4">
      <header className="mt-8 font-gasoek text-center text-3xl px-4 py-2 w-full max-w-md bg-rose-100 rounded-xl text-amber-900 shadow-lg">
        PARTY POOPERS
      </header>

      <div className="w-full max-w-md mt-8 mb-8">
        {showSignUp ? (
          <SignUpForm onToggle={() => setShowSignUp(false)} />
        ) : (
          <LoginForm onToggle={() => setShowSignUp(true)} />
        )}
      </div>
    </main>
  );
}
