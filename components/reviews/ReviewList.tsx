"use client";

import { useEffect, useState } from "react";

function maskEmail(email?: string | null) {
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return "Anonymous";
  }
  const [user] = email.split("@");
  if (!user) return "Anonymous";
  if (user.length <= 2) return user[0] + "*";
  return user.slice(0, 2) + "*******";
}

export function ReviewList({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [subratingMap, setSubratingMap] = useState<{ [key: string]: string }>({});

  const loadReviews = async () => {
    setLoading(true);
    const res = await fetch("/api/reviews/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, sort, page, limit: 10 })
    });

    const data = await res.json();
    setReviews(data.reviews || []);

    const subRes = await fetch("/api/reviews/subratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const subData = await subRes.json();
    const mapping = Object.fromEntries(
      (subData.subratings || []).map((s: any) => [s.id, s.name])
    );
    setSubratingMap(mapping);

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
        {console.log("REVIEW OBJECT:", review)}
        {reviews.map(review => (
          <div key={review.id} className="border-b pb-6">
            <div className="flex justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">{maskEmail(review.user_email)}</span>
                  <div className="text-yellow-500">★★★★★</div>
<div className="text-sm text-muted-foreground">
  {review.created_at ? new Date(review.created_at).toLocaleDateString() : "—"}
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
              </div>

              {review.review_subratings?.length > 0 && (
                <div className="ml-6 min-w-[140px] space-y-1 text-right">
                  {review.review_subratings.map((s: any) => (
                    <p key={s.subrating_id} className="text-xs text-gray-600">
                      {subratingMap[s.subrating_id] || "—"}: {s.value}★
                    </p>
                  ))}
                </div>
              )}
            </div>
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
