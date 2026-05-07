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
  eyebrow?: string;
}

export function ProductCarousel({ title, products, viewMoreSlug, eyebrow }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 480;
      scrollContainerRef.current.scrollTo({
        left:
          direction === 'left'
            ? scrollContainerRef.current.scrollLeft - scrollAmount
            : scrollContainerRef.current.scrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (products.length === 0) return null;

  return (
    <section className="space-y-6">
      {/* Section header */}
      <div className="flex items-end justify-between">
        <div>
          {eyebrow && (
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-rose-300 mb-1.5">
              {eyebrow}
            </p>
          )}
          <h2 className="text-3xl font-light text-stone-800 leading-tight" style={{ fontFamily: "'Playfair Display', serif" }}>
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-3 pb-1">
          {viewMoreSlug && (
            <Link
              href={`/collections/${viewMoreSlug}`}
              className="text-[12px] font-medium text-rose-300 hover:text-rose-400 transition-colors tracking-wide mr-2"
            >
              See All →
            </Link>
          )}
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors text-stone-500"
            aria-label="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors text-stone-500"
            aria-label="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => (
          <div key={product.id} className="flex-none w-[220px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
