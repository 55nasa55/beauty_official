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

export function ProductInfoImages({ images }: ProductInfoImagesProps) {
  if (!images || images.length === 0) {
    return null;
  }

  const INITIAL_COUNT = 1.5;      // first 1.5 images
  const LOAD_MORE_COUNT = 3;      // load 3 more per click

  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT);

  const visibleImages = images.slice(0, Math.ceil(visibleCount));
  const canLoadMore = visibleCount < images.length;

  const loadMore = () => {
    setVisibleCount((prev) => prev + LOAD_MORE_COUNT);
  };

return (
  <div className="mt-12">
    {visibleImages.map((image) => (
      <div key={image.id}>
        <div className="mx-auto max-w-[800px]"> 
          <Image
            src={image.image_url}
            alt=""
            width={800}
            height={1200}
            className="block w-full h-auto object-contain rounded-md"
          />
        </div>
      </div>
    ))}

    {canLoadMore && (
      <div className="flex justify-center mt-4">
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