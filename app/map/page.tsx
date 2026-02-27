import Link from "next/link";

export default function MapPage() {
  return (
    <main className="min-h-screen bg-amber-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl rounded-xl bg-rose-100 p-8 shadow-lg">
        <h1 className="font-gasoek text-3xl text-amber-900">MAP</h1>
        <p className="mt-3 font-rubik text-gray-700">
          Bathroom map page is under construction.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-xl bg-amber-900 px-4 py-2 font-rubik text-white hover:bg-amber-800 transition"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
