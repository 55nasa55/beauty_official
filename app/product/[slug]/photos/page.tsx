"use client";

import { useEffect, useState } from "react";
import { ImageModal } from "@/components/reviews/ImageModal";

export default function ProductPhotosPage({ params }: { params: { slug: string } }) {
  const { slug } = params;

  const [photos, setPhotos] = useState<string[]>([]);
  const [modal, setModal] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/reviews/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: slug, sort: "newest", page: 1, limit: 999 })
      });

      const data = await res.json();
      const all = data.reviews.flatMap((r: any) => r.images || []);
      setPhotos(all);
    };

    load();
  }, [slug]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-lg font-semibold mb-4">All Photos</h1>

      {photos.length === 0 && (
        <p className="text-gray-500">No photos yet.</p>
      )}

      <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
        {photos.map((url, i) => (
          <img
            key={i}
            src={url}
            onClick={() => setModal(url)}
            className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition"
          />
        ))}
      </div>

      {modal && (
        <ImageModal url={modal} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
