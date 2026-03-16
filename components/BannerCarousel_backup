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
  const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userInteractedRef = useRef(false);
  const isResettingRef = useRef(false);
  const programmaticScrollRef = useRef(false);

  if (banners.length === 0) return null;

  const total = banners.length;
  const allSlides = total > 1 ? [banners[total - 1], ...banners, banners[0]] : banners;

  const [renderIndex, setRenderIndex] = useState(total > 1 ? 1 : 0);
  const [realIndex, setRealIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isReady, setIsReady] = useState(false);

  const renderIndexToReal = (renderIdx: number) => {
    if (total === 1) return 0;
    if (renderIdx === 0) return total - 1;
    if (renderIdx === total + 1) return 0;
    return renderIdx - 1;
  };

  const scrollToRenderIndex = (renderIdx: number, smooth = true) => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const slideEl = container.children.item(renderIdx) as HTMLElement;
    if (!slideEl) return;

    container.scrollTo({
      left: slideEl.offsetLeft,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  const atomicJumpToRenderIndex = (targetIdx: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    isResettingRef.current = true;

    container.style.scrollBehavior = 'auto';
    container.style.scrollSnapType = 'none';

    scrollToRenderIndex(targetIdx, false);

    requestAnimationFrame(() => {
      container.style.scrollBehavior = '';
      container.style.scrollSnapType = '';

      requestAnimationFrame(() => {
        isResettingRef.current = false;
      });
    });
  };

  const restartAutoplayTimer = () => {
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }

    if (!isPlaying || total <= 1) return;

    autoplayTimeoutRef.current = setTimeout(() => {
      if (isScrollingRef.current || isResettingRef.current) {
        restartAutoplayTimer();
        return;
      }

      goToNext();
      restartAutoplayTimer();
    }, 5000);
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
    const target = renderIndex + 1;
    programmaticScrollRef.current = true;
    setRenderIndex(target);
    setRealIndex(renderIndexToReal(target));
    scrollToRenderIndex(target, true);
  };

  const goToPrevious = () => {
    if (total === 1) return;
    const target = renderIndex - 1;
    programmaticScrollRef.current = true;
    setRenderIndex(target);
    setRealIndex(renderIndexToReal(target));
    scrollToRenderIndex(target, true);
  };

  const handleNextClick = () => {
    goToNext();
    restartAutoplayTimer();
  };

  const handlePrevClick = () => {
    goToPrevious();
    restartAutoplayTimer();
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

  useEffect(() => {
    if (total <= 1) {
      setIsReady(true);
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    scrollToRenderIndex(1, false);
    setRenderIndex(1);
    setRealIndex(0);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsReady(true);
      });
    });
  }, []);

  useEffect(() => {
    if (!isPlaying || total <= 1) {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
        autoplayTimeoutRef.current = null;
      }
      return;
    }

    restartAutoplayTimer();

    return () => {
      if (autoplayTimeoutRef.current) {
        clearTimeout(autoplayTimeoutRef.current);
        autoplayTimeoutRef.current = null;
      }
    };
  }, [isPlaying, total]);

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

        if (isResettingRef.current) return;

        const containerCenter = container.scrollLeft + container.clientWidth / 2;
        let nearestIdx = 0;
        let minDistance = Infinity;

        for (let i = 0; i < container.children.length; i++) {
          const child = container.children.item(i) as HTMLElement;
          if (!child) continue;

          const childCenter = child.offsetLeft + child.offsetWidth / 2;
          const distance = Math.abs(childCenter - containerCenter);

          if (distance < minDistance) {
            minDistance = distance;
            nearestIdx = i;
          }
        }

        const settledRenderIndex = nearestIdx;
        setRenderIndex(settledRenderIndex);
        setRealIndex(renderIndexToReal(settledRenderIndex));

        programmaticScrollRef.current = false;

        if (settledRenderIndex === 0) {
          requestAnimationFrame(() => {
            atomicJumpToRenderIndex(total);
            setRenderIndex(total);
            setRealIndex(total - 1);
          });
        } else if (settledRenderIndex === total + 1) {
          requestAnimationFrame(() => {
            atomicJumpToRenderIndex(1);
            setRenderIndex(1);
            setRealIndex(0);
          });
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
  }, [total]);

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

  useEffect(() => {
    if (banners.length === 0 || total <= 6) {
      banners.forEach((banner) => {
        const img = new window.Image();
        img.src = banner.image_url;
      });
    }
  }, [banners, total]);

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className={`flex overflow-x-auto snap-x snap-mandatory gap-6 px-[10vw] scroll-px-[10vw] py-8 scrollbar-hide transition-opacity duration-200 ${
          isReady ? 'opacity-100' : 'opacity-0'
        }`}
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
                priority={total <= 6}
                loading={total <= 6 ? 'eager' : undefined}
                sizes="(min-width: 1280px) 1200px, 80vw"
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
            onClick={handlePrevClick}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="bg-white/90 hover:bg-white p-2 rounded-full transition-all hover:scale-110 shadow-md"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-4 h-4 text-gray-800" />
          </button>

          <button
            onClick={togglePlayPause}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
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
            onClick={handleNextClick}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
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
