"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Rating from "./Rating";
import UserAvatar from "./UserAvatar";

interface BathroomReview {
  id: string;
  rating: number;
  description: string;
  username: string;
  avatarUrl?: string | null;
  createdAt: string;
}

interface BathroomDetail {
  id: string;
  name: string;
  detail: string;
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
  onBackToMap: () => void;
}

function OpenCloseBadge({ isOpen }: { isOpen: boolean }) {
  return (
    <p
      className={`inline-flex items-center rounded-full px-3 py-1 font-rubik text-xs font-medium uppercase tracking-wider ${
        isOpen 
          ? "bg-green-500/10 text-green-700 border border-green-200" 
          : "bg-red-500/10 text-red-700 border border-red-200"
      }`}
    >
      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${isOpen ? "bg-green-500" : "bg-red-500"}`} />
      {isOpen ? "Open now" : "Closed"}
    </p>
  );
}

function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function BathroomDetailPanel({
  bathroomId,
  onBackToMap,
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

        if (!active) return;
        if (!response.ok || !data?.bathroom) {
          throw new Error(data?.error ?? "Failed to load bathroom.");
        }
        setBathroom(data.bathroom);
      } catch (error) {
        if (!active) return;
        setBathroom(null);
        setErrorMessage(error instanceof Error ? error.message : "Failed to load bathroom.");
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadBathroom();
    return () => { active = false; };
  }, [bathroomId]);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center bg-amber-50 px-6">
        <div className="w-full max-w-2xl rounded-[2rem] border border-amber-900/10 bg-rose-100 px-8 py-10 text-center font-rubik text-amber-900 shadow-[0_24px_80px_rgba(120,53,15,0.12)]">
          Loading bathroom...
        </div>
      </div>
    );
  }

  if (errorMessage || !bathroom) {
    return (
      <div className="flex h-full items-center justify-center bg-amber-50 px-6">
        <div className="w-full max-w-2xl rounded-[2rem] border border-red-200 bg-red-50 px-8 py-10 font-rubik text-red-700 shadow-[0_24px_80px_rgba(153,27,27,0.08)]">
          {errorMessage || "Bathroom not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.68),_transparent_42%),_#f8f4e6] pt-6">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <button
          type="button"
          onClick={onBackToMap}
          className="rounded-full border border-amber-900/30 bg-white/80 px-4 py-2 font-rubik text-sm text-amber-900 transition hover:bg-white cursor-pointer"
        >
          Back to map
        </button>

        <Link
          href={`/add-review?bathroomId=${bathroom.id}`}
          className="rounded-full bg-amber-900 px-4 py-2 font-rubik text-sm font-medium text-white transition hover:bg-amber-800"
        >
          Add review
        </Link>
      </div>

      <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10 lg:py-10">
        <div className="rounded-[2rem] border border-amber-900/10 bg-rose-100/95 p-8 shadow-[0_28px_90px_rgba(120,53,15,0.12)] lg:p-10">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="font-gasoek text-4xl leading-tight text-amber-900 lg:text-5xl">
                {bathroom.name}
              </h1>
              <div className="mt-1 lg:mt-2">
                <OpenCloseBadge isOpen={bathroom.isOpen} />
              </div>
            </div>
            
            <p className="mt-4 font-rubik text-xl text-slate-600">
              {bathroom.building} • Floor {bathroom.floor} • {bathroom.typeLabel}
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
            <section className="rounded-[1.5rem] border border-white/60 bg-white/55 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
              <p className="font-rubik text-[11px] uppercase tracking-[0.24em] text-amber-900/55">
                What people are saying
              </p>
              <p className="mt-3 font-rubik text-lg leading-8 text-slate-700">
                {bathroom.detail}
              </p>
            </section>

            <section className="rounded-[1.5rem] border border-amber-900/10 bg-amber-50/90 p-6">
              <p className="font-rubik text-[11px] uppercase tracking-[0.24em] text-amber-900/55">
                Rating Snapshot
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Rating value={bathroom.rating} />
                <span className="font-rubik text-2xl text-amber-900">
                  {bathroom.rating.toFixed(1)}
                </span>
              </div>
              <p className="mt-3 font-rubik text-sm text-slate-600">
                Based on {bathroom.reviewCount} review
                {bathroom.reviewCount === 1 ? "" : "s"}.
              </p>
            </section>
          </div>
        </div>

        <section className="mt-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-rubik text-[11px] uppercase tracking-[0.24em] text-amber-900/55">
                Community notes
              </p>
              <h2 className="mt-2 font-rubik text-3xl font-semibold text-amber-900">
                Reviews
              </h2>
            </div>
            <p className="font-rubik text-sm text-slate-500">
              {bathroom.reviewCount} total review
              {bathroom.reviewCount === 1 ? "" : "s"}
            </p>
          </div>

          {bathroom.reviews.length === 0 ? (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-amber-900/25 bg-white/60 p-6 font-rubik text-slate-600">
              No reviews yet.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {bathroom.reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-[1.5rem] border border-amber-900/10 bg-white/80 p-6 shadow-[0_16px_50px_rgba(15,23,42,0.06)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <Rating value={review.rating} />
                        <span className="font-rubik text-lg text-amber-900">
                          {review.rating}/5 poops
                        </span>
                      </div>
                      <p className="mt-4 font-rubik text-lg leading-8 text-slate-700">
                        {review.description || "No written review."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <UserAvatar size={44} src={review.avatarUrl ?? undefined} />
                      <div className="text-left">
                        <p className="font-rubik text-base text-slate-500">
                          {review.username}
                        </p>
                        {formatReviewDate(review.createdAt) ? (
                          <p className="mt-1 font-rubik text-sm text-slate-400">
                            {formatReviewDate(review.createdAt)}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
