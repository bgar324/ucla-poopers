import Rating from "@/app/components/Rating";

interface Review {
  id: string;
  rating: number;
  description: string;
  username?: string;
}

export default function Reviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <p className="font-rubik text-gray-600">
        No reviews yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="font-rubik text-xl font-semibold text-amber-900">
        Reviews
      </h2>

      {reviews.map((review) => (
        <div
          key={review.id}
          className="rounded-xl bg-white p-4 shadow-sm border border-amber-100"
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Rating value={review.rating} />
              <span className="font-rubik text-amber-900 text-sm">
                {review.rating}/5 poops
              </span>
            </div>
            {review.username && (
              <span className="text-sm text-gray-500 font-rubik">
                {review.username}
              </span>
            )}
          </div>

          <p className="mt-2 font-rubik text-gray-700">
            {review.description}
          </p>
        </div>
      ))}
    </div>
  );
}