'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ProductInfoImage {
  id: string;
  image_url: string;
  order_index: number;
}

interface ProductInfoImagesProps {
  images: ProductInfoImage[];
}

// Tailwind inline keyframes
const fadeKeyframes = `
@keyframes fadeInSlideUp {
  0% { opacity: 0; transform: translateY(16px); }
  100% { opacity: 1; transform: translateY(0); }
}
`;

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = fadeKeyframes;
  document.head.appendChild(style);
}

export function ProductInfoImages({ images }: ProductInfoImagesProps) {
  if (!images || images.length === 0) {
    return null;
  }

  const INITIAL_COUNT = 1.5;      // first 1.5 images
  const LOAD_MORE_COUNT = 3;      // load 3 more per click

  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  let visibleImages;
  if (visibleCount === INITIAL_COUNT) {
    // Show exactly 2 images in the array, but visually crop the second
    visibleImages = images.slice(0, 2);
  } else {
    visibleImages = images.slice(0, Math.ceil(visibleCount));
  }

  const loadMore = () => {
    setVisibleCount((prev) => prev + LOAD_MORE_COUNT);
  };

return (
  <div className="mt-12">
    {visibleImages.map((image, index) => {
      const isSecondImageAndInitial =
        visibleCount === INITIAL_COUNT && index === 1;

      return (
        <div
          key={image.id}
          className="mb-0 transition-all duration-500 ease-out opacity-0 translate-y-4 animate-[fadeInSlideUp_0.5s_ease-out_forwards]"
        >
          <div className="mx-auto max-w-[800px] relative">
            {isSecondImageAndInitial ? (
              <div className="relative overflow-hidden max-h-[420px]">
                <Image
                  src={image.image_url}
                  alt=""
                  width={800}
                  height={1200}
                  className="block w-full h-auto object-contain rounded-md"
                />
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-[rgba(255,255,255,1)] pointer-events-none" />
              </div>
            ) : (
              <Image
                src={image.image_url}
                alt=""
                width={800}
                height={1200}
                className="block w-full h-auto object-contain rounded-md"
              />
            )}
          </div>
        </div>
      );
    })}

    {visibleCount < images.length && (
      <div className="flex justify-center mt-6">
        <button
          onClick={loadMore}
          className="px-4 py-2 bg-black text-white rounded"
        >
          Show More
        </button>
      </div>
    )}
  </div>
);
}