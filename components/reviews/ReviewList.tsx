"use client";

import { useEffect, useState } from "react";
import { Star } from "./Star";
import { ImageModal } from "./ImageModal";

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
  const [loading, setLoading] = useState(true);
  const [subratingMap, setSubratingMap] = useState<{ [key: string]: string }>({});
  const [modalImage, setModalImage] = useState<string | null>(null);

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
      {/* REVIEW SUMMARY HEADER */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex">
          {[1,2,3,4,5].map(n => (
            <Star key={n} filled={n <= (reviews.length ?
              Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
            : 0)} />
          ))}
        </div>
        <p className="text-sm text-gray-600">
          {reviews.length} review{reviews.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* SORT TABS */}
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

      {/* LOADING */}
      {loading && (
        <p className="text-sm text-muted-foreground mt-4">Loading reviews...</p>
      )}

      {/* NO REVIEWS */}
      {!loading && reviews.length === 0 && (
        <p className="text-sm mt-4 text-muted-foreground">No reviews found.</p>
      )}

      {/* REVIEW LIST */}
      <div className="mt-8 space-y-10">
        {reviews.map(review => {
          console.log("REVIEW OBJECT:", review);

          return (
            <div key={review.id} className="border-b pb-6">
              <div className="flex justify-between">
                <div className="flex-1">
                  {/* User + Rating + Date */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {maskEmail(review.user_email)}
                    </span>

                    <div className="flex">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} filled={n <= review.rating} />
                      ))}
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {review.created_at
                        ? new Date(review.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
                        : "—"}
                    </div>
                  </div>

                  {/* Body */}
                  <p className="mt-2 text-sm whitespace-pre-line">{review.body}</p>

                  {/* Images */}
                  {review.images?.length > 0 && (
                    <div className="mt-3 flex gap-2">
                      {review.images.map((url: string, i: number) => (
                        <img
                          key={i}
                          src={url}
                          onClick={() => setModalImage(url)}
                          className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 transition"
                          alt=""
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* SUBRATINGS */}
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
          );
        })}
      </div>

      {/* PAGINATION */}
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

      {/* IMAGE MODAL */}
      {modalImage && (
        <ImageModal url={modalImage} onClose={() => setModalImage(null)} />
      )}
    </div>
  );
}