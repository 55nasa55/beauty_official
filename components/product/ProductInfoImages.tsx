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
    <div className="mt-12">
      {images.map((image) => (
        <div key={image.id} className="w-full flex justify-center py-8">
          <div className="w-full max-w-[800px] px-4">
            <Image
              src={image.image_url}
              alt=""
              width={800}
              height={1200}
              className="w-full h-auto object-contain rounded-md"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
