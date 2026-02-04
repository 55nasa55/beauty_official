"use client";

import { useEffect, useState } from "react";

export function WriteReviewButton({
  productId,
  onOpen
}: {
  productId: string;
  onOpen: () => void;
}) {
  const [hasReview, setHasReview] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      const res = await fetch("/api/reviews/user");
      const data = await res.json();

      if (data.error) {
        setHasReview(null);
        setLoading(false);
        return;
      }

      const exists = data.reviews?.some(
        (r: any) => r.product_id === productId
      );

      setHasReview(exists);
      setLoading(false);
    };

    check();
  }, [productId]);

  if (loading) return null;

  if (hasReview) {
    return (
      <p className="mt-4 text-sm text-muted-foreground">
        You already reviewed this product.
      </p>
    );
  }

  return (
    <button
      onClick={onOpen}
      className="mt-4 px-4 py-2 bg-black text-white rounded"
    >
      Write a Review
    </button>
  );
}
