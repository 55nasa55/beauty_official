"use client";

import { useEffect, useState } from "react";
import { maskEmail } from "@/lib/mask";
import { Button } from "@/components/ui/button";

export function ProductReviewsAdmin({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const load = async () => {
    setLoading(true);

    const res = await fetch("/api/reviews/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        sort,
        page,
        limit: 10
      })
    });

    const data = await res.json();
    let filtered = data.reviews || [];

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter((r: any) =>
        r.body.toLowerCase().includes(q)
      );
    }

    setReviews(filtered);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [productId, page, sort]);

  const deleteReview = async (id: string) => {
    const res = await fetch("/api/reviews/admin-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reviewId: id })
    });

    if (res.ok) load();
  };

  return (
    <div className="mt-8 border rounded-lg bg-white p-4">
      <h3 className="font-medium text-lg">Reviews</h3>

      {/* Search + Sort */}
      <div className="flex items-center gap-3 mt-4">
        <input
          placeholder="Search reviews..."
          className="border p-2 rounded flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border p-2 rounded"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="highest_rating">Highest Rating</option>
          <option value="photos">With Photos</option>
        </select>
      </div>

    {loading && (
        <p className="text-sm text-gray-500 mt-4">Loading...</p>
      )}

      {!loading && reviews.length === 0 && (
        <p className="text-sm text-gray-500 mt-4">No reviews found.</p>
      )}

      <div className="mt-4 space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="border rounded p-4 bg-gray-50">
            <div className="flex justify-between">
              <div>
                <p className="font-medium">{maskEmail(r.user_email)}</p>
                <p className="text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleString()}
                </p>
                <p className="text-sm mt-2 whitespace-pre-line">{r.body}</p>
              </div>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteReview(r.id)}
              >
                Delete
              </Button>
            </div>

            {/* Images */}
            {r.images?.length > 0 && (
              <div className="flex gap-2 mt-3">
                {r.images.map((img: string, i: number) => (
                  <img
                    key={i}
                    src={img}
                    className="w-16 h-16 object-cover rounded"
                  />
                ))}
              </div>
            )}

            {/* Subratings */}
            {r.review_subratings?.length > 0 && (
              <div className="mt-3 space-y-1 text-sm">
                {r.review_subratings.map((s: any) => (
                  <div key={s.subrating_id} className="flex justify-between">
                    <span>{s.subrating_name}</span>
                    <span>{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
