"use client";

import { useEffect, useState } from "react";

export function ReviewSummary({ productId }: { productId: string }) {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSummary() {
      try {
        const res = await fetch(`/api/reviews/summary`, {
          method: "POST",
          body: JSON.stringify({ productId }),
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        setSummary(data);
      } catch (err) {
        console.error("Failed to load review summary", err);
      } finally {
        setLoading(false);
      }
    }

    loadSummary();
  }, [productId]);

  if (loading) {
    return (
      <div className="mt-6 border-t pt-6">
        <h3 className="text-lg font-semibold">Reviews</h3>
        <p className="text-sm text-muted-foreground mt-2">Loading...</p>
      </div>
    );
  }

  if (!summary) return null;

  const { averageRating, totalReviews, breakdown, subratingAverages } = summary;

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-lg font-semibold">Reviews</h3>

      {totalReviews === 0 ? (
        <p className="text-sm text-gray-500 mt-2">No reviews yet.</p>
      ) : (
        <>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
            <span className="text-yellow-500">★★★★★</span>
            <span className="text-sm text-muted-foreground">({totalReviews})</span>
          </div>

          {subratingAverages?.length > 0 && (
            <div className="mt-4 space-y-1">
              {subratingAverages.map((sub: any) => (
                <div key={sub.id} className="flex justify-between text-sm">
                  <span>{sub.name}</span>
                  <span>{sub.average?.toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-4 space-y-1">
            {[5, 4, 3, 2, 1].map(star => {
              const count = breakdown[star] || 0;
              const pct = summary.totalReviews ? (count / summary.totalReviews) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm w-4">{star}</span>
                  <div className="flex-1 bg-gray-200 h-2 rounded">
                    <div
                      className="bg-black h-2 rounded"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
