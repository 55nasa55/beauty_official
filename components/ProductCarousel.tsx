'use client';

import { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import { ProductCard } from './ProductCard';
import { ProductWithVariants } from '@/lib/database.types';

interface ProductCarouselProps {
  title: string;
  products: ProductWithVariants[];
  viewMoreSlug?: string;
  eyebrow?: string;
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

export function ProductCarousel({ title, products, viewMoreSlug, eyebrow }: ProductCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const max = el.scrollWidth - el.clientWidth;
      setProgress(max > 0 ? el.scrollLeft / max : 0);
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -500 : 500, behavior: 'smooth' });
  };

  if (products.length === 0) return null;

  return (
    <section className="space-y-7">
      {/* Section header */}
      <div className="flex items-end justify-between">
        <div>
          {eyebrow && (
            <p className="text-[10px] uppercase tracking-[0.22em] font-bold mb-2"
              style={{ color: '#d4909e' }}>
              ✦ {eyebrow} ✦
            </p>
          )}
          <h2
            className="text-[2rem] font-light leading-none tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: '#3a2a2a' }}
          >
            {title}
          </h2>
        </div>

        <div className="flex items-center gap-3 pb-1">
          {viewMoreSlug && (
            <Link
              href={`/collections/${viewMoreSlug}`}
              className="text-[11.5px] font-semibold tracking-wide mr-1 transition-colors"
              style={{ color: '#d4909e' }}
            >
              See All →
            </Link>
          )}
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm hover:shadow"
            style={{ background: 'linear-gradient(135deg,#fce8ee,#f9d4de)', color: '#c07888', border: '1px solid #f4c0cc' }}
            aria-label="Scroll left"
          >
            <ChevLeft />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-150 shadow-sm hover:shadow"
            style={{ background: 'linear-gradient(135deg,#fce8ee,#f9d4de)', color: '#c07888', border: '1px solid #f4c0cc' }}
            aria-label="Scroll right"
          >
            <ChevRight />
          </button>
        </div>
      </div>

      {/* Cards scroll */}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scrollbar-blush scroll-smooth pb-4"
        style={{ msOverflowStyle: 'auto' }}
      >
        {products.map((product) => (
          <div key={product.id} className="flex-none w-[210px]">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      {/* Blush progress bar */}
      <div className="h-[3px] rounded-full overflow-hidden mx-1" style={{ background: '#fce0e8' }}>
        <div
          className="h-full rounded-full transition-all duration-150"
          style={{
            width: `${Math.max(8, progress * 100)}%`,
            background: 'linear-gradient(90deg, #f4b8c8, #e07090)',
          }}
        />
      </div>
    </section>
  );
}
