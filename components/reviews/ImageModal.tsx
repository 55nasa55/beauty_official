"use client";
export function ImageModal({ url, onClose }: { url: string; onClose: () => void }) {
  if (!url) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <img src={url} className="max-w-[90vw] max-h-[90vh] rounded shadow-lg" />
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-3xl"
      >
        ×
      </button>
    </div>
  );
}
