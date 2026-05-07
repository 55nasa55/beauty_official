'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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

  const containerRef = useRef<HTMLDivElement>(null);

  const autoplayTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const settleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isResettingRef = useRef(false);
  const programmaticScrollRef = useRef(false);
  const isPlayingRef = useRef(true);
  const renderIndexRef = useRef(0);

  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // realIndex: 0..total-1 for counter
  const [realIndex, setRealIndex] = useState(0);

  // renderIndex: index into repeated slides array
  const [renderIndex, setRenderIndex] = useState(0);

  if (!banners || banners.length === 0) return null;

  const total = banners.length;

  // Repeat banners to avoid ever hitting scroll boundaries
  // 5 copies is usually plenty for smooth looping in both directions.
  const COPIES = total > 1 ? 5 : 1;
  const MIDDLE_COPY = Math.floor(COPIES / 2);

  const allSlides = useMemo(() => {
    if (total <= 1) return banners;
    const out: Banner[] = [];
    for (let c = 0; c < COPIES; c++) out.push(...banners);
    return out;
  }, [banners, total]);

  const toRealIndex = (rIdx: number) => {
    if (total <= 1) return 0;
    // safe modulo for negatives (shouldn't happen, but just in case)
    return ((rIdx % total) + total) % total;
  };

  const middleRenderIndexForReal = (rReal: number) => {
    // Place the same real slide in the middle copy
    return MIDDLE_COPY * total + rReal;
  };

  const scrollToIndex = (idx: number, smooth: boolean) => {
    const container = containerRef.current;
    if (!container) return;

    const el = container.children.item(idx) as HTMLElement | null;
    if (!el) return;

    const targetLeft = el.offsetLeft - (container.clientWidth / 2 - el.clientWidth / 2);

    container.scrollTo({
      left: targetLeft,
      behavior: smooth ? 'smooth' : 'auto',
    });
  };

  const atomicJumpToIndex = (idx: number) => {
    const container = containerRef.current;
    if (!container) return;

    programmaticScrollRef.current = true;
    isResettingRef.current = true;

    const prevSnap = container.style.scrollSnapType;
    const prevBehavior = container.style.scrollBehavior;

    container.style.scrollSnapType = 'none';
    container.style.scrollBehavior = 'auto';

    scrollToIndex(idx, false);

    requestAnimationFrame(() => {
      container.style.scrollSnapType = prevSnap || '';
      container.style.scrollBehavior = prevBehavior || '';

      requestAnimationFrame(() => {
        isResettingRef.current = false;
        programmaticScrollRef.current = false;

        renderIndexRef.current = idx;
        setRenderIndex(idx);
        const newReal = toRealIndex(idx);
        setRealIndex(newReal);
      });
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

  const clearAutoplay = () => {
    if (autoplayTimeoutRef.current) {
      clearTimeout(autoplayTimeoutRef.current);
      autoplayTimeoutRef.current = null;
    }
  };

  const restartAutoplayTimer = () => {
    clearAutoplay();
    if (total <= 1) return;
    if (!isPlayingRef.current) return;

    autoplayTimeoutRef.current = setTimeout(() => {
      // If we’re mid-scroll/reset, delay instead of double-advancing
      if (isResettingRef.current) {
        restartAutoplayTimer();
        return;
      }
      goNext(true);
      restartAutoplayTimer();
    }, 5000);
  };


  const goNext = (resetTimer: boolean) => {
    if (total <= 1) return;

    const next = renderIndexRef.current + 1;
    const container = containerRef.current;

    programmaticScrollRef.current = true;
    renderIndexRef.current = next;
    setRenderIndex(next);
    setRealIndex(toRealIndex(next));

    // Temporarily disable snap to prevent fighting with smooth scroll
    if (container) {
      const prevSnap = container.style.scrollSnapType;
      container.style.scrollSnapType = 'none';
      scrollToIndex(next, true);
      requestAnimationFrame(() => {
        container.style.scrollSnapType = prevSnap || '';
      });
    } else {
      scrollToIndex(next, true);
    }

    if (resetTimer) restartAutoplayTimer();
  };

  const goPrev = (resetTimer: boolean) => {
    if (total <= 1) return;

    const prev = renderIndexRef.current - 1;
    const container = containerRef.current;

    programmaticScrollRef.current = true;
    renderIndexRef.current = prev;
    setRenderIndex(prev);
    setRealIndex(toRealIndex(prev));

    // Temporarily disable snap to prevent fighting with smooth scroll
    if (container) {
      const prevSnap = container.style.scrollSnapType;
      container.style.scrollSnapType = 'none';
      scrollToIndex(prev, true);
      requestAnimationFrame(() => {
        container.style.scrollSnapType = prevSnap || '';
      });
    } else {
      scrollToIndex(prev, true);
    }

    if (resetTimer) restartAutoplayTimer();
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      isPlayingRef.current = next;
      if (next) restartAutoplayTimer();
      else clearAutoplay();
      return next;
    });
  };

  const stopControlPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  // Preload banner images to avoid any "loading in" stutter
  useEffect(() => {
    if (typeof window === 'undefined') return;
    for (const b of banners) {
      if (!b?.image_url) continue;
      const img = new window.Image();
      img.src = b.image_url;
    }
  }, [banners]);

  // Initial position: start in the middle copy to guarantee peeks on both sides
  useEffect(() => {
    isPlayingRef.current = isPlaying;

    if (total <= 1) {
      renderIndexRef.current = 0;
      setRenderIndex(0);
      setRealIndex(0);
      setIsReady(true);
      return;
    }

    const start = middleRenderIndexForReal(0);
    setIsReady(false);
    renderIndexRef.current = start;
    setRenderIndex(start);
    setRealIndex(0);

    requestAnimationFrame(() => {
      scrollToIndex(start, false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setIsReady(true));
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  // Autoplay lifecycle
  useEffect(() => {
    clearAutoplay();
    isPlayingRef.current = isPlaying;

    if (total > 1 && isPlaying) restartAutoplayTimer();
    return () => clearAutoplay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, total]);

  // Scroll settle: update active slide + recenter away from edges
  useEffect(() => {
    if (total <= 1) return;

    const container = containerRef.current;
    if (!container) return;

    const getNearestIndex = () => {
      const center = container.scrollLeft + container.clientWidth / 2;
      let nearest = 0;
      let best = Infinity;
      const children = Array.from(container.children) as HTMLElement[];

      for (let i = 0; i < children.length; i++) {
        const el = children[i];
        const elCenter = el.offsetLeft + el.offsetWidth / 2;
        const dist = Math.abs(elCenter - center);
        if (dist < best) {
          best = dist;
          nearest = i;
        }
      }
      return nearest;
    };

    const onScroll = () => {
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);

      settleTimeoutRef.current = setTimeout(() => {
        if (isResettingRef.current) return;

        const settledRenderIdx = getNearestIndex();
        const settledRealIdx = toRealIndex(settledRenderIdx);

        // Update state with settled indices
        renderIndexRef.current = settledRenderIdx;
        setRenderIndex(settledRenderIdx);
        setRealIndex(settledRealIdx);

        // ALWAYS normalize to middle copy to prevent drift
        const normalizedRenderIdx = middleRenderIndexForReal(settledRealIdx);

        if (normalizedRenderIdx !== settledRenderIdx) {
          // Need to jump to normalized position
          atomicJumpToIndex(normalizedRenderIdx);
          // atomicJumpToIndex will set state, so return early
          return;
        }

        // No jump needed, clear programmatic flag
        programmaticScrollRef.current = false;
      }, 130);
    };

    container.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      container.removeEventListener('scroll', onScroll);
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, renderIndex]);

  // Pause autoplay on real user scroll interactions (not control clicks)
  useEffect(() => {
    if (total <= 1) return;

    const container = containerRef.current;
    if (!container) return;

    const pause = () => {
      if (programmaticScrollRef.current) return;
      setIsPlaying(false);
      isPlayingRef.current = false;
      clearAutoplay();
    };

    const onWheel = () => pause();
    const onTouchStart = () => pause();
    const onMouseDown = () => pause();

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

  // ResizeObserver: re-align current slide on layout changes to prevent jumping
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      if (isResettingRef.current) return;

      requestAnimationFrame(() => {
        // Only realign scroll position, don't change indices
        scrollToIndex(renderIndexRef.current, false);
      });
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  const eager = total <= 8; // safe for small sets

  return (
    <div className="relative bg-[#faf8f6] py-8 md:py-12">
      <div
        ref={containerRef}
        className={[
          'flex overflow-x-auto snap-x snap-mandatory gap-5 px-[8vw] scroll-px-[8vw] scrollbar-hide',
          'transition-opacity duration-300',
          isReady ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {allSlides.map((banner, idx) => (
          <div
            key={`${banner.id}-${idx}`}
            className="flex-shrink-0 w-[min(84vw,1160px)] snap-center"
          >
            <div
              onClick={() => handleBannerClick(banner)}
              className="relative w-full aspect-[16/9] md:aspect-[21/8] rounded-2xl overflow-hidden cursor-pointer group"
            >
              <Image
                src={banner.image_url}
                alt={banner.title}
                fill
                sizes="(min-width: 1280px) 1160px, 84vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                priority={eager}
                loading={eager ? 'eager' : undefined}
              />
              {/* Soft editorial overlay — lighter than before */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent" />

              {/* Text positioned bottom-left with editorial spacing */}
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-2 tracking-wide drop-shadow-sm" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {banner.title}
                </h2>
                {banner.description && (
                  <p className="text-sm md:text-base text-white/80 max-w-md font-light">
                    {banner.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Soft edge fades matching background */}
      <div
        className="absolute left-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-r from-[#faf8f6] to-transparent pointer-events-none z-10"
        aria-hidden="true"
      />
      <div
        className="absolute right-0 top-0 bottom-0 w-16 md:w-24 bg-gradient-to-l from-[#faf8f6] to-transparent pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Controls */}
      {total > 1 && (
        <div className="w-[84vw] max-w-[1160px] mx-auto mt-5 flex items-center justify-center gap-3">
          <button
            onMouseDown={stopControlPropagation}
            onTouchStart={stopControlPropagation}
            onClick={() => goPrev(true)}
            className="bg-white hover:bg-stone-50 border border-stone-200 p-2 rounded-full transition-all shadow-sm"
            aria-label="Previous banner"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-stone-600" />
          </button>

          <button
            onMouseDown={stopControlPropagation}
            onTouchStart={stopControlPropagation}
            onClick={togglePlayPause}
            className="bg-white hover:bg-stone-50 border border-stone-200 p-2 rounded-full transition-all shadow-sm"
            aria-label={isPlaying ? 'Pause autoplay' : 'Play autoplay'}
          >
            {isPlaying ? (
              <Pause className="w-3 h-3 text-stone-600" />
            ) : (
              <Play className="w-3 h-3 text-stone-600" />
            )}
          </button>

          <div className="text-stone-400 text-xs font-light tracking-wider">
            {realIndex + 1} / {total}
          </div>

          <button
            onMouseDown={stopControlPropagation}
            onTouchStart={stopControlPropagation}
            onClick={() => goNext(true)}
            className="bg-white hover:bg-stone-50 border border-stone-200 p-2 rounded-full transition-all shadow-sm"
            aria-label="Next banner"
          >
            <ChevronRight className="w-3.5 h-3.5 text-stone-600" />
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