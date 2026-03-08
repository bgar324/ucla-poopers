"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import Navbar from "../components/Navbar";
import ToiletBG from "../components/ToiletBG";

const BathroomMap = dynamic(() => import("../components/BathroomMap"), {
  ssr: false,
});

export default function MapPage() {
  return (
    <main className="min-h-screen bg-amber-50">
      <Navbar />
      <ToiletBG />

      <div className="relative z-10 grid min-h-[calc(100vh-5rem)] grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
        {/* Left Sidebar */}
        <aside className="border-b border-amber-900/20 bg-white/90 p-6 backdrop-blur-sm lg:border-r lg:border-b-0 lg:p-8">
          <div className="relative">
            <input
              type="text"
              placeholder="Search poop spots..."
              className="h-12 w-full rounded-full border border-amber-900/40 bg-white px-4 font-rubik text-amber-900 placeholder:text-amber-900/60 focus:outline-none focus:ring-2 focus:ring-amber-900"
            />
          </div>

          <div className="mt-7 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-rubik text-2xl font-semibold text-amber-900">
                Poop Spots
              </h2>
              <p className="font-rubik text-sm text-gray-500">
                Explore bathrooms across UCLA
              </p>

              <Link
                href="/add-review"
                className="mt-4 inline-flex rounded-full bg-amber-900 px-4 py-2 font-rubik font-semibold text-white transition hover:bg-amber-800"
              >
                Add Review
              </Link>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-amber-900/15 bg-rose-50/80 p-4">
            <h3 className="font-rubik text-base font-semibold text-amber-900">
              Map View
            </h3>
            <p className="mt-2 font-rubik text-sm text-gray-600">
              Click a bathroom marker to view its card. Your current location
              will appear on the map if location access is enabled.
            </p>

            <Link
              href="/dashboard"
              className="mt-4 inline-flex rounded-xl bg-white px-4 py-2 font-rubik text-amber-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              Back to Dashboard
            </Link>
          </div>
        </aside>

        {/* Right Map Panel */}
        <section className="relative min-h-[500px] bg-amber-50/40">
          <div className="absolute inset-0">
            <BathroomMap />
          </div>
        </section>
      </div>
    </main>
  );
}