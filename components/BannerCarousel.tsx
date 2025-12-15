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

  // Autoplay: use a single reschedulable timeout (prevents double-advance/skip issues)
  const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Scroll state guards
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScrollingRef = useRef(false);
  const isResettingRef = useRef(false);
  const programmaticScrollRef = useRef(false);

  // Keep latest state in refs (avoids stale closures in timers)
  const isPlayingRef = useRef(true);
  const renderIndexRef = useRef(0);
  const totalRef = useRef(0);

  const [isReady, setIsReady] = useState(false);

  // realIndex is ONLY for counter (0..total-1)
  const [realIndex, setRealIndex] = useState(0);

  // renderIndex is for the rendered slides array (includes clones)
  const [renderIndex, setRenderIndex] = useState(0);

  const [isPlaying, setIsPlaying] = useState(true);

  if (!banners || banners.length === 0) return null;

  const total = banners.length;
  totalRef.current = total;

  // Slides including clones for looping
  const allSlides = total > 1 ? [banners[total - 1], ...banners, banners[0]] : banners;

  const renderIndexToReal = (renderIdx: number) => {
    if (total === 1) return 0;
    if (renderIdx === 0) return total - 1;
    if (renderIdx === total + 1) return 0;
    return renderIdx - 1;
  };

  // --- Helpers ---

  const handleBannerClick = (banner: Banner) => {
    const href = getBannerLink(banner);
    if (banner.target_type === 'external') {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(href);
    }
  };

  const scrollToRenderIndex = (targetRenderIdx: number, smooth: boolean) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const slideEl = container.children.item(targetRenderIdx) as HTMLElement | null;
    if (!slideEl) return;

    container.scrollTo({
      left: slideEl.offsetLeft,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  // Find which slide is nearest the center of the container
  const getNearestRenderIndex = () => {
    const container = scrollContainerRef.current;
    if (!container) return renderIndexRef.current;

    const center = container.scrollLeft + container.clientWidth / 2;

    let nearestIdx = 0;
    let bestDist = Infinity;

    const children = Array.from(container.children) as HTMLElement[];
    for (let i = 0; i < children.length; i++) {
      const el = children[i];
      const elCenter = el.offsetLeft + el.offsetWidth / 2;
      const dist = Math.abs(elCenter - center);
      if (dist < bestDist) {
        bestDist = dist;
        nearestIdx = i;
      }
    }

    return nearestIdx;
  };

  // Atomic jump for clone->real: disable snap for 1 frame to prevent the visible "off-center" flash
  const atomicJumpToRenderIndex = (targetIdx: number) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    isResettingRef.current = true;

    // Temporarily disable snapping & smooth behavior
    const prevSnap = container.style.scrollSnapType;
    const prevBehavior = container.style.scrollBehavior;

    container.style.scrollSnapType = 'none';
    container.style.scrollBehavior = 'auto';

    scrollToRenderIndex(targetIdx, false);

    requestAnimationFrame(() => {
      container.style.scrollSnapType = prevSnap || '';
      container.style.scrollBehavior = prevBehavior || '';

      isResettingRef.current = false;
      programmaticScrollRef.current = false;

      setRenderIndex(targetIdx);
      renderIndexRef.current = targetIdx;

      const newReal = renderIndexToReal(targetIdx);
      setRealIndex(newReal);
    });
  };

  const clearAutoplay = () => {
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
  };

  const restartAutoplayTimer = () => {
    clearAutoplay();

    if (totalRef.current <= 1) return;
    if (!isPlayingRef.current) return;

    autoplayTimeoutRef.current = setTimeout(() => {
      // If currently scrolling/resetting, delay and try again (prevents catching up / double-advance)
      if (isScrollingRef.current || isResettingRef.current) {
        restartAutoplayTimer();
        return;
      }

      // Advance exactly one slide
      goToNext(true);

      // Schedule next tick
      restartAutoplayTimer();
    }, 5000);
  };

  const goToNext = (fromAutoplayOrArrow: boolean) => {
    if (totalRef.current <= 1) return;

    const current = renderIndexRef.current;
    const target = current + 1; // can become total+1 (first clone)

    programmaticScrollRef.current = true;

    setRenderIndex(target);
    renderIndexRef.current = target;

    const nextReal = renderIndexToReal(target);
    setRealIndex(nextReal);

    scrollToRenderIndex(target, true);

    // Reset timer if user clicked arrow, or if autoplay tick executed (keeps cadence stable)
    if (fromAutoplayOrArrow) restartAutoplayTimer();
  };

  const goToPrevious = (fromArrow: boolean) => {
    if (totalRef.current <= 1) return;

    const current = renderIndexRef.current;
    const target = current - 1; // can become 0 (last clone)

    programmaticScrollRef.current = true;

    setRenderIndex(target);
    renderIndexRef.current = target;

    const prevReal = renderIndexToReal(target);
    setRealIndex(prevReal);

    scrollToRenderIndex(target, true);

    if (fromArrow) restartAutoplayTimer();
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      isPlayingRef.current = next;

      if (next) {
        restartAutoplayTimer();
      } else {
        clearAutoplay();
      }

      return next;
    });
  };

  // Keep refs in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    renderIndexRef.current = renderIndex;
  }, [renderIndex]);

  // Preload banner images to avoid "loading in" during loop/reset
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!banners?.length) return;

    for (const b of banners) {
      if (!b?.image_url) continue;
      const img = new window.Image();
      img.src = b.image_url;
    }
  }, [banners]);

  // Initial positioning: avoid initial flash by hiding until positioned on first real slide
  useEffect(() => {
    if (total <= 1) {
      setRenderIndex(0);
      renderIndexRef.current = 0;
      setRealIndex(0);
      setIsReady(true);
      return;
    }

    const container = scrollContainerRef.current;
    if (!container) return;

    // Start at first real slide (render index 1)
    setIsReady(false);
    setRenderIndex(1);
    renderIndexRef.current = 1;
    setRealIndex(0);

    // Ensure DOM has children before scrolling
    requestAnimationFrame(() => {
      scrollToRenderIndex(1, false);

      // Only show after 2 frames so browser paints at correct position (prevents flash)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsReady(true);
        });
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // Autoplay lifecycle
  useEffect(() => {
    clearAutoplay();
    if (total <= 1) return;

    if (isPlaying) {
      restartAutoplayTimer();
    }

    return () => {
      clearAutoplay();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, total]);

  // Scroll settle handler (updates index + performs clone->real atomic reset)
  useEffect(() => {
    if (total <= 1) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const onScroll = () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      isScrollingRef.current = true;

      scrollTimeoutRef.current = setTimeout(() => {
        isScrollingRef.current = false;

        // Avoid fighting during atomic reset
        if (isResettingRef.current) return;

        const settled = getNearestRenderIndex();

        setRenderIndex(settled);
        renderIndexRef.current = settled;

        const settledReal = renderIndexToReal(settled);
        setRealIndex(settledReal);

        // Clone boundaries: atomic reset AFTER settle
        if (settled === 0) {
          // last clone -> jump to last real (render index = total)
          atomicJumpToRenderIndex(total);
          return;
        }

        if (settled === total + 1) {
          // first clone -> jump to first real (render index = 1)
          atomicJumpToRenderIndex(1);
          return;
        }

        // Programmatic scroll done
        programmaticScrollRef.current = false;
      }, 140);
    };

    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // Pause autoplay on true user scroll interactions (but not control clicks)
  useEffect(() => {
    if (total <= 1) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const pauseOnUserScroll = () => {
      // If we are scrolling because code initiated it, don't pause
      if (programmaticScrollRef.current) return;

      setIsPlaying(false);
      isPlayingRef.current = false;
      clearAutoplay();
    };

    const onWheel = () => pauseOnUserScroll();
    const onTouchStart = () => pauseOnUserScroll();
    const onMouseDown = () => pauseOnUserScroll();

    container.addEventListener('wheel', onWheel, { passive: true });
    container.addEventListener('touchstart', onTouchStart, { passive: true });
    container.addEventListener('mousedown', onMouseDown);

    return () => {
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('touchstart', onTouchStart);
      container.removeEventListener('mousedown', onMouseDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  const stopControlPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className={[
          'flex overflow-x-auto snap-x snap-mandatory gap-6 px-[10vw] scroll-px-[10vw] py-8 scrollbar-hide',
          'transition-opacity duration-200',
          isReady ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allSlides.map((banner, index) => {
          // For small banner counts, eager load to avoid clone boundary flashing
          const eager = total <= 6;

          return (
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
                  sizes="(min-width: 1280px) 1200px, 80vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  priority={eager}
                  loading={eager ? 'eager' : undefined}
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
          );
        })}
      </div>

      {/* Edge fades */}
      <div
        className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent pointer-events-none z-10"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Controls under the centered banner */}
      {total > 1 && (
        <div className="w-[80vw] max-w-[1200px] mx-auto mt-4 flex items-center justify-center gap-4">
          <button
            onMouseDown={stopControlPropagation}
            onTouchStart={stopControlPropagation}
            onClick={() => goToPrevious(true)}
            className="bg-white/90 hover:bg-white p-2 rounded-full transition-all hover:scale-110 shadow-md"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-4 h-4 text-gray-800" />
          </button>

          <button
            onMouseDown={stopControlPropagation}
            onTouchStart={stopControlPropagation}
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
            onMouseDown={stopControlPropagation}
            onTouchStart={stopControlPropagation}
            onClick={() => goToNext(true)}
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