'use client';

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

  return (
    <div className="mt-12 space-y-6">
      {images.map((image) => (
        <div key={image.id} className="relative w-full">
          <Image
            src={image.image_url}
            alt="Product information"
            width={1200}
            height={600}
            className="w-full h-auto rounded-lg"
          />
        </div>
      ))}
    </div>
  );
}
