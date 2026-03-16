"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

export function ReviewModal({
  open,
  onClose,
  productId,
  variants
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  variants: any[];
}) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [subratings, setSubratings] = useState<any[]>([]);
  const [subValues, setSubValues] = useState<{ [key: string]: number }>({});
  const [variantId, setVariantId] = useState<string | null>(null);
  const [body, setBody] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load subratings
  useEffect(() => {
    if (!open) return;

    const load = async () => {
      const res = await fetch("/api/reviews/subratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId })
      });

      const data = await res.json();
      setSubratings(data.subratings || []);
    };

    load();
  }, [open, productId]);

  const handleImageChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files) return;

    const selected = Array.from(files);

    const newImages: string[] = [];

    for (const file of selected) {
      if (images.length + newImages.length >= 3) break;

      const reader = new FileReader();

      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      newImages.push(base64);
    }

    setImages((prev) => [...prev, ...newImages]);
  };

  // Submit review
  const submit = async () => {
    if (!user) {
      window.location.href = "/login?redirect_back=1";
      return;
    }

    if (rating === 0 || !body.trim()) {
      setErrorMsg("Please leave a rating and review.");
      return;
    }

    if (images.length > 3) {
      setErrorMsg("Max 3 images allowed");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const res = await fetch("/api/reviews/create", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        variantId: variantId || null, // important fix
        rating,
        body,
        images,
        subratings: subValues
      })
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      if (data?.error) {
        setErrorMsg(data.error);
      } else {
        setErrorMsg("We could not submit your review. Please try again.");
      }
      return;
    }

    onClose();
    window.location.reload();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded w-full max-w-lg max-h-[90vh] overflow-y-auto">

        <h2 className="text-lg font-semibold">Write a Review</h2>

        {/* Star rating */}
        <div className="mt-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setRating(s)}
              className={s <= rating ? "text-yellow-500 text-xl" : "text-gray-300 text-xl"}
            >
              ★
            </button>
          ))}
        </div>

        {/* Subratings */}
        {subratings.length > 0 && (
          <div className="mt-4 space-y-3">
            {subratings.map((sub: any) => (
              <div key={sub.id}>
                <p className="text-sm">{sub.name}</p>
                <div className="flex gap-2 mt-1">
                  {[1,2,3,4,5].map(num => (
                    <button
                      key={num}
                      className={`px-2 py-1 rounded text-sm border ${
                        subValues[sub.id] === num ? "bg-black text-white" : ""
                      }`}
                      onClick={() => setSubValues(prev => ({ ...prev, [sub.id]: num }))}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Variant selection */}
        {variants?.length > 0 && (
          <div className="mt-4">
            <p className="text-sm mb-1">Variant</p>
            <select
              className="border p-2 rounded w-full"
              onChange={(e) => setVariantId(e.target.value)}
            >
              <option value="">Select variant</option>
              {variants.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Body */}
        <textarea
          className="mt-4 border p-2 rounded w-full h-28"
          placeholder="Write your review..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />

        {/* Image upload */}
        <div className="mt-4">
          <p className="text-sm">Upload images (max 3)</p>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            className="mt-1"
          />
          {images.length > 0 && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {images.map((img, index) => (
                <div key={index} className="relative">
                  <img
                    src={img}
                    alt="preview"
                    className="w-20 h-20 object-cover rounded"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setImages((prev) => prev.filter((_, i) => i !== index))
                    }
                    className="absolute top-0 right-0 bg-black text-white text-xs px-1 rounded"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Error */}
        {errorMsg && (
          <p className="text-red-500 text-sm mt-2">{errorMsg}</p>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button className="px-4 py-2 bg-gray-200 rounded" onClick={onClose}>
            Cancel
          </button>

          <button
            disabled={loading}
            className="px-4 py-2 bg-black text-white rounded disabled:bg-gray-400"
            onClick={submit}
          >
            {loading ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </div>
    </div>
  );
}