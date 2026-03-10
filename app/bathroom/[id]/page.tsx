import prisma from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import Rating from "@/app/components/Rating";
import Reviews from "./Reviews";

interface BathroomDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatBathroomType(type: string) {
  switch (type) {
    case "accessible":
      return "Accessible";
    case "female":
      return "Female";
    case "male":
      return "Male";
    default:
      return "Gender Neutral";
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
          user: { select: { username: true } },
        },
      },
    },
  });

  if (!bathroom) {
    notFound();
  }

  const reviews = bathroom.reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    description: r.description,
    username: r.user?.username ?? "Anonymous",
  }));

  const ratings = bathroom.reviews.map((r) => r.rating);
  const averageRating =
    ratings.length === 0
      ? 0
      : Math.round((ratings.reduce((s, r) => s + r, 0) / ratings.length) * 10) / 10;

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

        <OpenClose
          bathroomId={bathroom.id}
          initialIsOpen={!bathroom.is_closed}
        />

        <div className="flex items-center gap-3">
          <Rating value={averageRating} />
          <span className="font-rubik text-amber-900">
            {averageRating.toFixed(1)}/5 poops
            {reviews.length > 0 && (
              <span className="text-gray-600 font-normal"> ({reviews.length} review{reviews.length === 1 ? "" : "s"})</span>
            )}
          </span>
        </div>

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
