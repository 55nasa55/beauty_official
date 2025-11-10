'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Banner } from '@/lib/database.types';

interface BannerCarouselProps {
  banners: Banner[];
}

const getBannerLink = (banner: Banner) => {
  switch (banner.target_type) {
    case 'product':
      return `/product/${banner.target_value}`;
    case 'category':
      return `/category/${banner.target_value}`;
    case 'collection':
      return `/collection/${banner.target_value}`;
    case 'brand':
      return `/brand/${banner.target_value}`;
    case 'external':
      return banner.target_value;
    default:
      return '/';
  }
};

export function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length === 0) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [banners.length]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? banners.length - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
  };

  if (banners.length === 0) return null;

  return (
    <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-lg group">
      {banners.map((banner, index) => {
        const href = getBannerLink(banner);
        const className = `absolute inset-0 transition-opacity duration-500 ${
          index === currentIndex ? 'opacity-100' : 'opacity-0'
        }`;

        const bannerContent = (
          <>
            <Image
              src={banner.image_url}
              alt={banner.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 text-white">
              <h2 className="text-3xl md:text-5xl font-light mb-3 tracking-wide">
                {banner.title}
              </h2>
              <p className="text-lg md:text-xl text-white/90 max-w-2xl">
                {banner.description}
              </p>
            </div>
          </>
        );

        return banner.target_type === 'external' ? (
          <a
            key={banner.id}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            {bannerContent}
          </a>
        ) : (
          <Link key={banner.id} href={href} className={className}>
            {bannerContent}
          </Link>
        );
      })}

      <button
        onClick={(e) => {
          e.preventDefault();
          goToPrevious();
        }}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label="Previous banner"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={(e) => {
          e.preventDefault();
          goToNext();
        }}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label="Next banner"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={(e) => {
              e.preventDefault();
              setCurrentIndex(index);
            }}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex
                ? 'bg-white w-6'
                : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Go to banner ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
