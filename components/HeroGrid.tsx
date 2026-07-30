'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeroProduct {
  id: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  retail: number;
  member: number;
}

interface HeroGridProps {
  products: HeroProduct[];
}

export function HeroGrid({ products }: HeroGridProps) {
  const [offset, setOffset] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const count = isMobile ? 2 : 5;
  const rotate = useCallback(() => {
    setOffset((prev) => (prev + count) % Math.max(products.length, 1));
  }, [count, products.length]);

  useEffect(() => {
    if (products.length <= count) return;
    const interval = setInterval(rotate, 3500);
    return () => clearInterval(interval);
  }, [rotate, products.length, count]);

  if (products.length === 0) return null;

  const visible = [];
  for (let i = 0; i < count; i++) {
    visible.push(products[(offset + i) % products.length]);
  }

  return (
    <div
      className="grid gap-5 transition-opacity duration-500"
      style={{
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 232px)',
      }}
    >
      {visible.map((p, i) => {
        const savings = p.retail - p.member;
        return (
          <Link
            key={`${p.id}-${offset}-${i}`}
            href={`/product/${p.slug}`}
            className="block bg-white border border-light-gray rounded-card p-1 relative overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-1"
            style={{ boxShadow: '0 0 0 rgba(0,0,0,0)' }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 6px 16px rgba(169,201,236,0.25)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)')}
          >
            {/* Savings badge */}
            {savings > 0 && (
              <div
                className="absolute z-20 text-[9px] font-bold px-2 py-0.5 rounded-savings text-white"
                style={{ background: '#FF3366', top: 6, left: 6 }}
              >
                Save ${savings.toFixed(0)}
              </div>
            )}

            {/* Image */}
            <div
              className="relative overflow-hidden rounded-[4px] -m-1 mb-1"
              style={{ aspectRatio: '1 / 1', width: 'calc(100% + 8px)' }}
            >
              {mounted ? (
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-cover"
                  sizes="222px"
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#f0f0f0' }} />
              )}
            </div>

            {/* Brand */}
            <div className="text-[8px] font-bold text-gray uppercase tracking-[0.4px] mb-0.5">
              {p.brand}
            </div>

            {/* Name */}
            <p className="m-0 mb-1 font-semibold text-[10px] text-charcoal leading-[1.3] line-clamp-2">
              {p.name}
            </p>

            {/* Pricing */}
            <div className="flex border-t border-light-gray pt-1 mt-auto">
              <div className="flex-1 pr-1.5">
                <span className="block text-[8px] uppercase font-bold text-gray tracking-[0.5px]">Retail</span>
                <span className="text-[9px] text-gray line-through">${p.retail.toFixed(2)}</span>
              </div>
              <div className="flex-1 pl-1.5 border-l border-light-gray">
                <span className="block text-[8px] uppercase font-bold text-gray tracking-[0.5px]">Member</span>
                <span className="text-[12px] font-bold text-coral">${p.member.toFixed(2)}</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
