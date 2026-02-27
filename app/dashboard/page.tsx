"use client";

import supabase from "@/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import ToiletBG from "../components/ToiletBG";

interface CurrentUser {
  email: string;
  displayName: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    let active = true;

    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active) {
        return;
      }

      if (!session?.user) {
        router.replace("/");
        return;
      }

      const metadata = session.user.user_metadata ?? {};
      const firstName =
        typeof metadata.first_name === "string" ? metadata.first_name : "";
      const displayName = firstName || session.user.email || "Bruin User";

      setUser({
        email: session.user.email ?? "",
        displayName,
      });
      setIsLoading(false);
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-amber-50 px-4">
        <ToiletBG />
        <div className="w-full max-w-xl rounded-xl bg-rose-100 p-8 text-center shadow-lg font-rubik text-amber-900">
          Loading dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-10">
      <ToiletBG />

      <div className="mx-auto w-full max-w-3xl space-y-6">
        <section className="rounded-xl bg-rose-100 p-8 shadow-lg">
          <h1 className="font-gasoek text-3xl text-amber-900">DASHBOARD</h1>
          <p className="mt-3 font-rubik text-gray-700">
            Signed in as{" "}
            <span className="font-medium">{user?.displayName}</span>
            {user?.email ? ` (${user.email})` : ""}.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/profile"
              className="font-rubik inline-flex items-center rounded-xl bg-amber-900 px-4 py-2 text-white shadow-md hover:bg-amber-800 transition"
            >
              Go To Profile
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="font-rubik cursor-pointer inline-flex items-center rounded-xl border border-amber-900 px-4 py-2 text-amber-900 hover:bg-amber-100 transition"
            >
              Sign Out
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
