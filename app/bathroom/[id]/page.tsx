import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import OpenClose from "./OpenClose";
import Reviews from "./Reviews";

interface BathroomDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatBathroomType(type: string) {
  switch (type) {
    case "gender-neutral":
      return "Gender Neutral";
    case "accessible":
      return "Accessible";
    default:
      return "Standard";
  }
}

export default async function BathroomDetailPage({
  params,
}: BathroomDetailPageProps) {
  const { id } = await params;

  const bathroom = await prisma.bathroom.findUnique({
    where: { id },
    include: {
      reviews: {
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          rating: true,
          description: true,
        },
      },
    },
  });

  if (!bathroom) {
    notFound();
  }

  const reviews = bathroom.reviews.map(
    (review) => `${review.rating}/5 - ${review.description}`,
  );

  return (
    <main className="min-h-screen bg-amber-50 px-4 py-10">
      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl bg-rose-100 p-8 shadow-lg">
        <div>
          <h1 className="font-gasoek text-3xl text-amber-900">
            {bathroom.name}
          </h1>
          <p className="mt-2 font-rubik text-gray-700">
            {bathroom.building} • Floor {bathroom.floor} •{" "}
            {formatBathroomType(bathroom.type)}
          </p>
        </div>

        <OpenClose isOpen={!bathroom.is_closed} />
        <Reviews reviews={reviews} />

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
