"use client";

import { useEffect, useState } from "react";
import { maskEmail } from "@/lib/mask";

export function ReviewList({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const loadReviews = async () => {
    setLoading(true);
    const res = await fetch("/api/reviews/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, sort, page, limit: 10 })
    });

    const data = await res.json();
    setReviews(data.reviews || []);
    setLoading(false);
  };

  useEffect(() => {
    loadReviews();
  }, [sort, page]);

  return (
    <div className="mt-8">

      <div className="flex gap-3 border-b pb-3">
        {[
          { key: "newest", label: "Newest" },
          { key: "oldest", label: "Oldest" },
          { key: "highest_rating", label: "Highest Rating" },
          { key: "photos", label: "With Photos" }
        ].map(opt => (
          <button
            key={opt.key}
            className={`text-sm ${
              sort === opt.key ? "font-semibold underline" : "text-muted-foreground"
            }`}
            onClick={() => setSort(opt.key)}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading && (
        <p className="text-sm text-muted-foreground mt-4">Loading reviews...</p>
      )}

      {!loading && reviews.length === 0 && (
        <p className="text-sm mt-4 text-muted-foreground">No reviews found.</p>
      )}

      <div className="mt-6 space-y-6">
        {reviews.map(review => (
          <div key={review.id} className="border-b pb-6">

            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{maskEmail(review.user_email)}</span>
              <div className="text-yellow-500">★★★★★</div>
              <div className="text-sm text-muted-foreground">
                {new Date(review.created_at).toLocaleDateString()}
              </div>
            </div>

            <p className="mt-2 text-sm whitespace-pre-line">{review.body}</p>

            {review.images?.length > 0 && (
              <div className="mt-3 flex gap-2">
                {review.images.map((url: string, i: number) => (
                  <img
                    key={i}
                    src={url}
                    className="w-20 h-20 object-cover rounded"
                    alt=""
                  />
                ))}
              </div>
            )}

            {review.review_subratings?.length > 0 && (
              <div className="mt-3 space-y-1 text-sm">
                {review.review_subratings.map((s: any) => (
                  <div key={s.subrating_name} className="flex justify-between">
                    <span>{s.subrating_name}</span>
                    <span>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          disabled={page <= 1}
          onClick={() => setPage(p => Math.max(1, p - 1))}
          className="text-sm disabled:text-gray-400"
        >
          Previous
        </button>
        <button
          onClick={() => setPage(p => p + 1)}
          className="text-sm"
        >
          Next
        </button>
      </div>
    </div>
  );
}
