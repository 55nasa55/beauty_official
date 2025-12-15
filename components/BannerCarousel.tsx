'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
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

  const handleBannerClick = (banner: Banner) => {
    const href = getBannerLink(banner);

    if (banner.target_type === 'external') {
      window.open(href, '_blank', 'noopener,noreferrer');
    } else {
      router.push(href);
    }
  };

  if (banners.length === 0) return null;

  return (
    <div className="relative">
      <div
        className="flex overflow-x-auto snap-x snap-mandatory gap-6 px-[10vw] py-8 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
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
                priority
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

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
