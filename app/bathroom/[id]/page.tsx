import Link from "next/link";
import OpenClose from "./OpenClose";
import Reviews from "./Reviews";

interface BathroomDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BathroomDetailPage({
  params,
}: BathroomDetailPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl bg-rose-100 p-8 shadow-lg">
        <div>
          <h1 className="font-gasoek text-3xl text-amber-900">BATHROOM {id}</h1>
          <p className="mt-2 font-rubik text-gray-700">
            Detail page scaffold for restroom metadata and activity.
          </p>
        </div>

        <OpenClose isOpen />
        <Reviews reviews={["Super clean", "Great location near lecture hall"]} />

        <Link
          href="/dashboard"
          className="inline-flex rounded-xl bg-amber-900 px-4 py-2 font-rubik text-white hover:bg-amber-800 transition"
        >
          Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
