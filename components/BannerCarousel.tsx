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

  const [currentIndex, setCurrentIndex] = useState(1);
  const [isPlaying, setIsPlaying] = useState(true);

  if (banners.length === 0) return null;

  const totalBanners = banners.length;
  const allSlides = totalBanners > 1 ? [banners[totalBanners - 1], ...banners, banners[0]] : banners;

  const scrollToIndex = (index: number, smooth = true) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const slideWidth = container.scrollWidth / allSlides.length;
    const targetScroll = slideWidth * index;

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
    if (!scrollContainerRef.current) return;
    setCurrentIndex((prev) => prev + 1);
    scrollToIndex(currentIndex + 1, true);
  };

  const goToPrevious = () => {
    if (!scrollContainerRef.current) return;
    setCurrentIndex((prev) => prev - 1);
    scrollToIndex(currentIndex - 1, true);
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  const getRealIndex = (index: number) => {
    if (totalBanners === 1) return 1;
    if (index === 0) return totalBanners;
    if (index === allSlides.length - 1) return 1;
    return index;
  };

  useEffect(() => {
    if (totalBanners <= 1) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    scrollToIndex(1, false);
  }, []);

  useEffect(() => {
    if (totalBanners <= 1 || !isPlaying) return;

    autoplayIntervalRef.current = setInterval(() => {
      if (!isScrollingRef.current) {
        goToNext();
      }
    }, 5000);

    return () => {
      if (autoplayIntervalRef.current) {
        clearInterval(autoplayIntervalRef.current);
      }
    };
  }, [isPlaying, currentIndex, totalBanners]);

  useEffect(() => {
    if (totalBanners <= 1) return;

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
        const newIndex = Math.round(scrollPosition / slideWidth);

        if (newIndex !== currentIndex) {
          setCurrentIndex(newIndex);

          if (newIndex === 0) {
            setTimeout(() => {
              scrollToIndex(totalBanners, false);
              setCurrentIndex(totalBanners);
            }, 50);
          } else if (newIndex === allSlides.length - 1) {
            setTimeout(() => {
              scrollToIndex(1, false);
              setCurrentIndex(1);
            }, 50);
          }
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
  }, [currentIndex, totalBanners, allSlides.length]);

  useEffect(() => {
    if (totalBanners <= 1) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const handleUserScroll = () => {
      setIsPlaying(false);
    };

    let isUserScrolling = false;
    let scrollTimeout: NodeJS.Timeout;

    const detectUserScroll = () => {
      if (!isScrollingRef.current) return;

      if (!isUserScrolling) {
        isUserScrolling = true;
        handleUserScroll();
      }

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isUserScrolling = false;
      }, 200);
    };

    container.addEventListener('scroll', detectUserScroll, { passive: true });
    container.addEventListener('touchstart', () => {
      isUserScrolling = true;
    }, { passive: true });

    return () => {
      container.removeEventListener('scroll', detectUserScroll);
      clearTimeout(scrollTimeout);
    };
  }, [totalBanners]);

  const displayIndex = getRealIndex(currentIndex);

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

      {totalBanners > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-3 rounded-full transition-all opacity-0 md:group-hover:opacity-100 md:hover:scale-110 z-20 shadow-lg"
            style={{ opacity: 1 }}
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-6 md:right-8 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 md:p-3 rounded-full transition-all opacity-0 md:group-hover:opacity-100 md:hover:scale-110 z-20 shadow-lg"
            style={{ opacity: 1 }}
            aria-label="Next banner"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-800" />
          </button>

          <div className="absolute bottom-6 md:bottom-8 right-6 md:right-8 flex items-center gap-3 z-20">
            <div className="text-white/80 text-sm font-light bg-black/30 px-3 py-1.5 rounded-full backdrop-blur-sm">
              {displayIndex} / {totalBanners}
            </div>

            <button
              onClick={togglePlayPause}
              className="bg-white/90 hover:bg-white p-2 rounded-full transition-all hover:scale-110 shadow-lg"
              aria-label={isPlaying ? 'Pause autoplay' : 'Play autoplay'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 text-gray-800" />
              ) : (
                <Play className="w-4 h-4 text-gray-800" />
              )}
            </button>
          </div>
        </>
      )}

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
