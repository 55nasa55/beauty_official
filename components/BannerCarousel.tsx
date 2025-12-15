'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
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
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const autoplayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userInteractedRef = useRef(false);

  const [realIndex, setRealIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  if (banners.length === 0) return null;

  const total = banners.length;
  const wrap = (i: number) => ((i % total) + total) % total;

  const allSlides = total > 1 ? [banners[total - 1], ...banners, banners[0]] : banners;

  const renderIndexToReal = (renderIdx: number) => {
    if (total === 1) return 0;
    if (renderIdx === 0) return total - 1;
    if (renderIdx === total + 1) return 0;
    return renderIdx - 1;
  };

  const realToRenderIndex = (realIdx: number) => {
    if (total === 1) return 0;
    return realIdx + 1;
  };

  const scrollToRenderIndex = (renderIdx: number, smooth = true) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const slideWidth = container.scrollWidth / allSlides.length;
    const targetScroll = slideWidth * renderIdx;

    container.scrollTo({
      left: targetScroll,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  const handleBannerClick = (banner: Banner) => {
    const href = getBannerLink(banner);

    if (banner.target_type === 'external') {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(href);
    }
  };

  const goToNext = () => {
    if (total === 1) return;
    const nextReal = wrap(realIndex + 1);
    setRealIndex(nextReal);
    scrollToRenderIndex(realToRenderIndex(nextReal), true);
  };

  const goToPrevious = () => {
    if (total === 1) return;
    const prevReal = wrap(realIndex - 1);
    setRealIndex(prevReal);
    scrollToRenderIndex(realToRenderIndex(prevReal), true);
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  useEffect(() => {
    if (total <= 1) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    scrollToRenderIndex(1, false);
  }, []);

  useEffect(() => {
    if (total <= 1 || !isPlaying) return;

    if (autoplayIntervalRef.current) {
      clearInterval(autoplayIntervalRef.current);
    }

    autoplayIntervalRef.current = setInterval(() => {
      if (!isScrollingRef.current && !userInteractedRef.current) {
        goToNext();
      }
    }, 5000);

    return () => {
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current);
      }
    };
  }, [isPlaying, realIndex, total]);

  useEffect(() => {
    if (total <= 1) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      isScrollingRef.current = true;

      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;

        const slideWidth = container.scrollWidth / allSlides.length;
        const scrollPosition = container.scrollLeft;
        const renderIdx = Math.round(scrollPosition / slideWidth);

        const newRealIndex = renderIndexToReal(renderIdx);

        if (newRealIndex !== realIndex) {
          setRealIndex(newRealIndex);
        }

        if (renderIdx === 0) {
          setTimeout(() => {
            scrollToRenderIndex(total, false);
          }, 50);
        } else if (renderIdx === total + 1) {
          setTimeout(() => {
            scrollToRenderIndex(1, false);
          }, 50);
        }
      }, 150);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [realIndex, total, allSlides.length]);

  useEffect(() => {
    if (total <= 1) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const handleUserInteraction = () => {
      userInteractedRef.current = true;
      setIsPlaying(false);
    };

    const handleWheel = () => handleUserInteraction();
    const handleTouchStart = () => handleUserInteraction();
    const handleMouseDown = () => handleUserInteraction();

    container.addEventListener('wheel', handleWheel, { passive: true });
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('mousedown', handleMouseDown, { passive: true });

    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('mousedown', handleMouseDown);
    };
  }, [total]);

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-[10vw] py-8 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {allSlides.map((banner, index) => (
          <div
            key={`${banner.id}-${index}`}
            className="flex-shrink-0 w-[80vw] max-w-[1200px] snap-center"
          >
            <div
              onClick={() => handleBannerClick(banner)}
              className="relative w-full aspect-[16/6] rounded-lg overflow-hidden cursor-pointer group"
            >
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                priority={index <= 2}
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
            </div>
          </div>
        ))}
      </div>

      <div
        className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"
        aria-hidden="true"
      />

      <div
        className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"
        aria-hidden="true"
      />

      {total > 1 && (
        <div className="w-[80vw] max-w-[1200px] mx-auto mt-4 flex items-center justify-center gap-4">
          <button
            onClick={goToPrevious}
            className="bg-white/90 hover:bg-white p-2 rounded-full transition-all hover:scale-110 shadow-md"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-4 h-4 text-gray-800" />
          </button>

          <button
            onClick={togglePlayPause}
            className="bg-white/90 hover:bg-white p-2 rounded-full transition-all hover:scale-110 shadow-md"
            aria-label={isPlaying ? 'Pause autoplay' : 'Play autoplay'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 text-gray-800" />
            ) : (
              <Play className="w-3.5 h-3.5 text-gray-800" />
            )}
          </button>

          <div className="text-gray-600 text-sm font-light">
            {realIndex + 1} / {total}
          </div>

          <button
            onClick={goToNext}
            className="bg-white/90 hover:bg-white p-2 rounded-full transition-all hover:scale-110 shadow-md"
            aria-label="Next banner"
          >
            <ChevronRight className="w-4 h-4 text-gray-800" />
          </button>
        </div>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
