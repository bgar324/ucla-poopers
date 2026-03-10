"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import supabase from "@/supabaseClient";
import ConfirmActionModal from "./ConfirmActionModal";
import Rating from "./Rating";
import UserAvatar from "./UserAvatar";

interface BathroomReview {
  id: string;
  rating: number;
  description: string;
  username: string;
  userId: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  editedAt?: string | null;
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

interface ProfileRecord {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface BathroomDetailPanelProps {
  bathroomId: string;
  onBack: () => void;
  backLabel?: string;
  variant?: "default" | "embedded";
  initialEditingReviewId?: string | null;
  editorRequestKey?: number;
  onReviewSaved?: () => void;
}

function OpenCloseBadge({ isOpen }: { isOpen: boolean }) {
  return (
    <p
      className={`inline-flex items-center rounded-full px-3 py-1 font-rubik text-xs font-medium uppercase tracking-wider ${
        isOpen
          ? "border border-green-200 bg-green-500/10 text-green-700"
          : "border border-red-200 bg-red-500/10 text-red-700"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          isOpen ? "bg-green-500" : "bg-red-500"
        }`}
      />
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

function formatRatingLabel(value: number) {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}

async function fetchBathroomDetail(bathroomId: string) {
  const response = await fetch(`/api/bathrooms/${bathroomId}`, {
    cache: "no-store",
  });
  const data = (await response.json().catch(() => null)) as
    | { bathroom?: BathroomDetail; error?: string }
    | null;

  if (!response.ok || !data?.bathroom) {
    throw new Error(data?.error ?? "Failed to load bathroom.");
  }

  return data.bathroom;
}

export default function BathroomDetailPanel({
  bathroomId,
  onBack,
  backLabel = "Back",
  variant = "default",
  initialEditingReviewId = null,
  editorRequestKey = 0,
  onReviewSaved,
}: BathroomDetailPanelProps) {
  const [bathroom, setBathroom] = useState<BathroomDetail | null>(null);
  const [viewer, setViewer] = useState<{
    id: string;
    supabaseAuthId: string;
    username: string;
    avatarUrl: string | null;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [existingRatingForEdit, setExistingRatingForEdit] = useState<number | null>(
    null,
  );
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [reviewDescription, setReviewDescription] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [reviewPendingDelete, setReviewPendingDelete] =
    useState<BathroomReview | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const lastAutoOpenRequestRef = useRef<string | null>(null);

  const isEmbedded = variant === "embedded";
  const shellClassName = isEmbedded
    ? "relative z-10 h-full overflow-y-auto pt-6"
    : "h-full overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.68),_transparent_42%),_#f8f4e6] pt-6";
  const statusShellClassName = isEmbedded
    ? "relative z-10 flex h-full items-center justify-center px-6"
    : "flex h-full items-center justify-center bg-amber-50 px-6";
  const viewerReview =
    bathroom && viewer
      ? bathroom.reviews.find((review) => review.userId === viewer.id) ?? null
      : null;

  useEffect(() => {
    let active = true;

    const loadViewer = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!active || !session?.access_token || !session.user?.id) {
        return;
      }

      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!active) {
        return;
      }

      if (!response.ok) {
        setViewer({
          id: "",
          supabaseAuthId: session.user.id,
          username: "You",
          avatarUrl:
            typeof session.user.user_metadata?.avatar_url === "string"
              ? session.user.user_metadata.avatar_url
              : null,
        });
        return;
      }

      const data = (await response.json()) as { user: ProfileRecord };

      if (!active) {
        return;
      }

      setViewer({
        id: data.user.id,
        supabaseAuthId: session.user.id,
        username: data.user.username,
        avatarUrl: data.user.avatarUrl,
      });
    };

    void loadViewer();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setErrorMessage("");

    const loadBathroom = async () => {
      try {
        const nextBathroom = await fetchBathroomDetail(bathroomId);
        if (!active) return;
        setBathroom(nextBathroom);
      } catch (error) {
        if (!active) return;
        setBathroom(null);
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to load bathroom.",
        );
      } finally {
        if (active) setIsLoading(false);
      }
    };

    void loadBathroom();
    return () => {
      active = false;
    };
  }, [bathroomId]);

  useEffect(() => {
    if (!bathroom || !initialEditingReviewId) {
      return;
    }

    const requestSignature = `${bathroomId}:${initialEditingReviewId}:${editorRequestKey}`;

    if (lastAutoOpenRequestRef.current === requestSignature) {
      return;
    }

    const reviewToEdit = bathroom.reviews.find(
      (review) => review.id === initialEditingReviewId,
    );

    if (!reviewToEdit) {
      return;
    }

    lastAutoOpenRequestRef.current = requestSignature;
    setReviewError("");
    setIsWritingReview(true);
    setEditingReviewId(reviewToEdit.id);
    setExistingRatingForEdit(reviewToEdit.rating);
    setSelectedRating(0);
    setReviewDescription(reviewToEdit.description);
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [bathroom, initialEditingReviewId, editorRequestKey]);

  const openComposer = (reviewToEdit?: BathroomReview | null) => {
    setReviewError("");
    setIsWritingReview(true);
    setEditingReviewId(reviewToEdit?.id ?? null);
    setExistingRatingForEdit(reviewToEdit?.rating ?? null);
    setSelectedRating(0);
    setReviewDescription(reviewToEdit?.description ?? "");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const closeComposer = () => {
    setIsWritingReview(false);
    setEditingReviewId(null);
    setExistingRatingForEdit(null);
    setSelectedRating(0);
    setReviewDescription("");
    setReviewError("");
  };

  const handleSubmitReview = async () => {
    if (!viewer?.supabaseAuthId) {
      setReviewError("Sign in to post a review.");
      return;
    }

    const ratingToSubmit =
      selectedRating || (editingReviewId ? existingRatingForEdit ?? 0 : 0);

    if (!ratingToSubmit) {
      setReviewError("Select a rating.");
      return;
    }

    setIsSubmittingReview(true);
    setReviewError("");

    try {
      const response = await fetch("/api/reviews", {
        method: editingReviewId ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supabaseAuthId: viewer.supabaseAuthId,
          bathroomId,
          reviewId: editingReviewId,
          review: {
            rating: ratingToSubmit,
            description: reviewDescription.trim(),
          },
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to save review.");
      }

      const refreshedBathroom = await fetchBathroomDetail(bathroomId);
      setBathroom(refreshedBathroom);
      closeComposer();
      onReviewSaved?.();
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : "Failed to save review.",
      );
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!reviewPendingDelete) {
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      setReviewError("Sign in to delete a review.");
      return;
    }

    setDeletingReviewId(reviewPendingDelete.id);
    setReviewError("");

    try {
      const response = await fetch("/api/reviews", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          supabaseAuthId: session.user.id,
          reviewId: reviewPendingDelete.id,
          bathroomId,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(data?.error ?? "Failed to delete review.");
      }

      const refreshedBathroom = await fetchBathroomDetail(bathroomId);
      setBathroom(refreshedBathroom);

      if (editingReviewId === reviewPendingDelete.id) {
        closeComposer();
      }

      setReviewPendingDelete(null);
      onReviewSaved?.();
    } catch (error) {
      setReviewError(
        error instanceof Error ? error.message : "Failed to delete review.",
      );
    } finally {
      setDeletingReviewId(null);
    }
  };

  if (isLoading) {
    return (
      <div className={statusShellClassName}>
        <div className="w-full max-w-2xl rounded-[2rem] border border-amber-900/10 bg-rose-100 px-8 py-10 text-center font-rubik text-amber-900 shadow-[0_24px_80px_rgba(120,53,15,0.12)]">
          Loading bathroom...
        </div>
      </div>
    );
  }

  if (errorMessage || !bathroom) {
    return (
      <div className={statusShellClassName}>
        <div className="w-full max-w-2xl rounded-[2rem] border border-red-200 bg-red-50 px-8 py-10 font-rubik text-red-700 shadow-[0_24px_80px_rgba(153,27,27,0.08)]">
          {errorMessage || "Bathroom not found."}
        </div>
      </div>
    );
  }

  return (
    <div className={shellClassName}>
      <ConfirmActionModal
        isOpen={Boolean(reviewPendingDelete)}
        title="Delete this review?"
        description={
          reviewPendingDelete
            ? `This removes your review from ${bathroom.name}. This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete review"
        cancelLabel="Keep review"
        isConfirming={Boolean(deletingReviewId)}
        onCancel={() => {
          if (!deletingReviewId) {
            setReviewPendingDelete(null);
          }
        }}
        onConfirm={() => void handleDeleteReview()}
      />

      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-6 py-4 lg:px-10">
        <button
          type="button"
          onClick={onBack}
          className="cursor-pointer shadow-md rounded-full border border-amber-900/30 bg-white/80 px-4 py-2 font-rubik text-sm text-amber-900 transition hover:bg-rose-50"
        >
          {backLabel}
        </button>
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
          <div className="flex flex-wrap items-end justify-between gap-4 px-4">
            <div className="flex items-center gap-3">
              <h2 className="font-rubik text-3xl font-semibold text-amber-900">
                Reviews
              </h2>
              <button
                type="button"
                onClick={() => {
                  if (isWritingReview) {
                    closeComposer();
                    return;
                  }

                  openComposer(viewerReview);
                }}
                className="flex cursor-pointer items-center gap-2 rounded-full border border-amber-900/20 p-2 text-amber-900 shadow-sm transition hover:bg-rose-50 hover:shadow-md"
                aria-label={viewerReview ? "Edit your review" : "Add a review"}
              >
                {viewerReview ? (
                  <Pencil size={16} strokeWidth={2} />
                ) : (
                  <Plus size={16} strokeWidth={2} />
                )}
              </button>
            </div>
            <p className="font-rubik text-sm text-slate-500">
              {bathroom.reviewCount} total review
              {bathroom.reviewCount === 1 ? "" : "s"}
            </p>
          </div>

          {isWritingReview ? (
            <div className="animate-in slide-in-from-top-2 mt-5 fade-in duration-300">
              <article className="rounded-[1.5rem] border border-amber-900/10 bg-white/80 p-6 shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <UserAvatar size={44} src={viewer?.avatarUrl ?? undefined} />

                    <div>
                      <p className="font-rubik text-base text-slate-600">
                        {viewer?.username ?? "Loading..."}
                      </p>

                      <p className="mt-1 font-rubik text-sm text-slate-400">
                        {formatReviewDate(new Date().toISOString())}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Rating
                      value={selectedRating}
                      interactive
                      onChange={setSelectedRating}
                    />
                    <span className="font-rubik text-lg text-amber-900">
                      {selectedRating
                        ? `${formatRatingLabel(selectedRating)}/5 poops`
                        : editingReviewId
                          ? "Select new rating"
                          : "Select rating"}
                    </span>
                  </div>
                </div>

                <div className="mt-4 border-t border-amber-900/10 pt-4">
                  <textarea
                    ref={textareaRef}
                    value={reviewDescription}
                    onChange={(event) => setReviewDescription(event.target.value)}
                    placeholder="Write your review..."
                    rows={3}
                    className="w-full resize-none rounded-lg border border-amber-900/20 p-3 font-rubik text-lg text-slate-800 outline-none focus:border-amber-900"
                  />

                  {reviewError ? (
                    <p className="mt-3 font-rubik text-sm text-red-600">
                      {reviewError}
                    </p>
                  ) : null}

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={closeComposer}
                      className="rounded-full border border-amber-900/20 bg-white px-4 py-2 font-rubik text-amber-900 transition hover:bg-amber-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitReview}
                      disabled={isSubmittingReview}
                      className="rounded-full bg-amber-900 px-4 py-2 font-rubik text-white transition hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                    >
                      {isSubmittingReview
                        ? editingReviewId
                          ? "Saving..."
                          : "Posting..."
                        : editingReviewId
                          ? "Save changes"
                          : "Post Review"}
                    </button>
                  </div>
                </div>
              </article>
            </div>
          ) : null}

          {bathroom.reviews.length === 0 ? (
            <div className="mt-5 rounded-[1.5rem] border border-dashed border-amber-900/25 bg-white/60 p-6 font-rubik text-slate-600">
              No reviews yet.
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {bathroom.reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-[1.5rem] border border-amber-900/10 bg-white/80 p-6 shadow-md transition hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <UserAvatar size={44} src={review.avatarUrl ?? undefined} />

                      <div>
                        <p className="font-rubik text-base text-slate-600">
                          {review.username}
                        </p>

                        {formatReviewDate(review.createdAt) || review.editedAt ? (
                          <p className="mt-1 font-rubik text-sm text-slate-400">
                            {formatReviewDate(review.createdAt)}
                            {review.editedAt ? (
                              <span className="ml-2 italic">(Edited)</span>
                            ) : null}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {review.userId && viewer?.id === review.userId ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openComposer(review)}
                            className="rounded-full border border-amber-900/20 p-2 text-amber-900 transition hover:bg-rose-50 hover:cursor-pointer"
                            aria-label="Edit your review"
                          >
                            <Pencil size={14} strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setReviewPendingDelete(review)}
                            disabled={deletingReviewId === review.id}
                            className="rounded-full border border-red-200 p-2 text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 hover:cursor-pointer"
                            aria-label="Delete your review"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                          </button>
                        </div>
                      ) : null}

                      <div className="flex items-center gap-3">
                        <Rating value={review.rating} />
                        <span className="font-rubik text-lg text-amber-900">
                          {formatRatingLabel(review.rating)}/5 poops
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 border-t border-amber-900/10 pt-4">
                    <p className="font-rubik text-xl leading-8 text-slate-800">
                      {review.description || "No written review."}
                    </p>
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
