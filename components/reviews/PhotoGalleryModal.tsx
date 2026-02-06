"use client";

import { useState } from "react";
import { ImageModal } from "./ImageModal";

export function PhotoGalleryModal({
  open,
  onClose,
  photos,
}: {
  open: boolean;
  onClose: () => void;
  photos: string[];
}) {
  const [zoom, setZoom] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  if (!open) return null;

  const pageSize = 20;
  const maxPage = Math.max(1, Math.ceil(photos.length / pageSize));

  const start = (page - 1) * pageSize;
  const visible = photos.slice(start, start + pageSize);

  return (
    <div className="fixed inset-0 bg-black/60 z-[999] flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-lg shadow-lg relative p-5 max-h-[90vh] overflow-hidden">

        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-2xl"
          onClick={onClose}
        >
          ×
        </button>

        <h2 className="text-lg font-semibold mb-4">Photos</h2>

        {/* Scrollable grid */}
        <div className="overflow-y-auto no-scrollbar" style={{ maxHeight: "60vh" }}>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
            {visible.map((url, i) => (
              <img
                key={i}
                src={url}
                onClick={() => setZoom(url)}
                className="w-full h-32 object-cover rounded cursor-pointer hover:opacity-80 transition"
              />
            ))}
          </div>
        </div>

        {/* Pagination */}
        {maxPage > 1 && (
          <div className="mt-4 flex justify-center">
            <button
              disabled={page >= maxPage}
              onClick={() => setPage(page + 1)}
              className="px-4 py-2 text-sm border rounded"
            >
              More ({page}/{maxPage})
            </button>
          </div>
        )}

      </div>

      {zoom && <ImageModal url={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}
