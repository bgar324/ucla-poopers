interface ReviewsProps {
  reviews: string[];
}

export default function Reviews({ reviews }: ReviewsProps) {
  if (reviews.length === 0) {
    return <p className="font-rubik text-sm text-gray-500">No reviews yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {reviews.map((review, index) => (
        <li
          key={`${review}-${index}`}
          className="rounded-lg border border-amber-200 bg-white px-3 py-2 font-rubik text-sm text-gray-700"
        >
          {review}
        </li>
      ))}
    </ul>
  );
}
