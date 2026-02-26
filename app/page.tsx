"use client"

import { useState } from "react";
import LoginForm from "./components/LoginForm";
import SignUpForm from "./components/SignUpForm";

export default function Home() {
  const [showSignUp, setShowSignUp] = useState(false);

  return (
    <main className="flex justify-center items-center min-h-screen">
      {showSignUp ? (
        <SignUpForm onToggle={() => setShowSignUp(false)} />
      ) : (
        <LoginForm onToggle={() => setShowSignUp(true)} />
      )}
    </main>
  );
}
