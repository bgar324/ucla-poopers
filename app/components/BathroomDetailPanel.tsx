"use client";

import { useEffect, useState } from "react";
import Rating from "./Rating";

interface BathroomReview {
  id: string;
  rating: number;
  description: string;
  username: string;
}

interface BathroomDetail {
  id: string;
  name: string;
  building: string;
  floor: number;
  typeLabel: string;
  isOpen: boolean;
  rating: number;
  reviewCount: number;
  reviews: BathroomReview[];
}

interface BathroomDetailPanelProps {
  bathroomId: string;
}

function OpenCloseBadge({ isOpen }: { isOpen: boolean }) {
  return (
    <p
      className={`inline-block rounded-lg px-3 py-1 font-rubik text-sm ${
        isOpen ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"
      }`}
    >
      {isOpen ? "Open now" : "Closed"}
    </p>
  );
}

export default function BathroomDetailPanel({
  bathroomId,
}: BathroomDetailPanelProps) {
  const [bathroom, setBathroom] = useState<BathroomDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMessage("");

    const loadBathroom = async () => {
      try {
        const response = await fetch(`/api/bathrooms/${bathroomId}`);
        const data = (await response.json().catch(() => null)) as
          | { bathroom?: BathroomDetail; error?: string }
          | null;

        if (!active) {
          return;
        }

        if (!response.ok || !data?.bathroom) {
          throw new Error(data?.error ?? "Failed to load bathroom.");
        }

        setBathroom(data.bathroom);
      } catch (error) {
        if (!active) {
          return;
        }

        setBathroom(null);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load bathroom.",
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadBathroom();

    return () => {
      active = false;
    };
  }, [bathroomId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-amber-50 px-4">
        <div className="w-full max-w-3xl rounded-xl bg-rose-100 p-8 text-center font-rubik text-amber-900 shadow-lg">
          Loading bathroom...
        </div>
      </div>
    );
  }

  if (errorMessage || !bathroom) {
    return (
      <div className="flex h-full items-center justify-center bg-amber-50 px-4">
        <div className="w-full max-w-3xl rounded-xl border border-red-200 bg-red-50 p-8 font-rubik text-red-700 shadow-lg">
          {errorMessage || "Bathroom not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-amber-50 px-4 py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-3xl space-y-6 rounded-xl bg-rose-100 p-8 shadow-lg">
        <div>
          <h1 className="font-gasoek text-3xl text-amber-900">
            {bathroom.name}
          </h1>
          <p className="mt-2 font-rubik text-gray-700">
            {bathroom.building} • Floor {bathroom.floor} • {bathroom.typeLabel}
          </p>
        </div>

        <OpenCloseBadge isOpen={bathroom.isOpen} />

        <div className="flex items-center gap-3">
          <Rating value={bathroom.rating} />
          <span className="font-rubik text-amber-900">
            {bathroom.rating.toFixed(1)}/5 poops
            {bathroom.reviewCount > 0 ? (
              <span className="font-normal text-gray-600">
                {" "}
                ({bathroom.reviewCount} review
                {bathroom.reviewCount === 1 ? "" : "s"})
              </span>
            ) : null}
          </span>
        </div>

        {bathroom.reviews.length === 0 ? (
          <p className="font-rubik text-gray-600">No reviews yet.</p>
        ) : (
          <div className="space-y-4">
            <h2 className="font-rubik text-xl font-semibold text-amber-900">
              Reviews
            </h2>

            {bathroom.reviews.map((review) => (
              <div
                key={review.id}
                className="rounded-xl border border-amber-100 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Rating value={review.rating} />
                    <span className="font-rubik text-sm text-amber-900">
                      {review.rating}/5 poops
                    </span>
                  </div>

                  <span className="font-rubik text-sm text-gray-500">
                    {review.username}
                  </span>
                </div>

                <p className="mt-2 font-rubik text-gray-700">
                  {review.description || "No written review."}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
