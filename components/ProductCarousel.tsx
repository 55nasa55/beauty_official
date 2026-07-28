'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { ProductCard } from './ProductCard';
import { ProductWithVariants } from '@/lib/database.types';

interface ProductCarouselProps {
  title: string;
  products: ProductWithVariants[];
  viewMoreSlug?: string;
}

function ChevLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

export function ProductCarousel({ title, products, viewMoreSlug }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section>
      {/* Section header — matches prototype: h2 left, View All → right, 40px bottom margin */}
      <div className="flex items-end justify-between mb-10">
        <h2 className="text-section-h2">{title}</h2>
        <div className="flex items-center gap-3 pb-1">
          {viewMoreSlug && (
            <Link
              href={`/collections/${viewMoreSlug}`}
              className="text-[15px] font-bold text-coral hover:text-coral-hover transition-colors mr-1"
            >
              View All →
            </Link>
          )}
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 border border-light-gray bg-off-white text-charcoal hover:border-coral hover:text-coral"
            aria-label="Scroll left"
          >
            <ChevLeft />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 border border-light-gray bg-off-white text-charcoal hover:border-coral hover:text-coral"
            aria-label="Scroll right"
          >
            <ChevRight />
          </button>
        </div>
      </div>

      {/* Cards — 14px gap matching prototype .product-grid */}
      <div
        ref={scrollRef}
        className="flex gap-[14px] overflow-x-auto scrollbar-hide scroll-smooth pb-4"
      >
        {products.map((product) => (
          <div key={product.id} className="flex-none w-[210px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  );
}
