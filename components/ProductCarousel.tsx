'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { ProductCard } from './ProductCard';
import { ProductWithVariants } from '@/lib/database.types';
import { useRef } from 'react';

interface ProductCarouselProps {
  title: string;
  products: ProductWithVariants[];
  viewMoreSlug?: string;
}

export function ProductCarousel({ title, products, viewMoreSlug }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400;
      const newScrollLeft =
        direction === 'left'
          ? scrollContainerRef.current.scrollLeft - scrollAmount
          : scrollContainerRef.current.scrollLeft + scrollAmount;

      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: 'smooth',
      });
    }
  };

  if (products.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-light tracking-wide">{title}</h2>
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full border hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full border hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex gap-6 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="flex-none w-[250px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {viewMoreSlug && (
        <div className="flex justify-center mt-6">
          <Link
            href={`/collections/${viewMoreSlug}`}
            className="px-8 py-3 border border-gray-300 rounded-full font-light tracking-wide hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
          >
            View More
          </Link>
        </div>
      )}
    </div>
  );
}
