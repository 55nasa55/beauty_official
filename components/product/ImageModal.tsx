"use client";

import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function ImageModal({
  images,
  initialIndex,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, images.length - 1));
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white hover:text-gray-300 transition-colors z-10"
        aria-label="Close"
      >
        <X size={32} />
      </button>

      <img
        src={images[index]}
        alt=""
        className="max-h-[85vh] max-w-[85vw] object-contain"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            disabled={index === 0}
            className="absolute left-6 text-white hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous image"
          >
            <ChevronLeft size={48} />
          </button>

          <button
            onClick={() => setIndex((i) => Math.min(i + 1, images.length - 1))}
            disabled={index === images.length - 1}
            className="absolute right-6 text-white hover:text-gray-300 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next image"
          >
            <ChevronRight size={48} />
          </button>

          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 text-white text-sm">
            {index + 1} / {images.length}
          </div>
        </>
      )}
    </div>
  );
}
