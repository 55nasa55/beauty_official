import Link from 'next/link';
import Image from 'next/image';
import { Brand } from '@/lib/database.types';
import { Star } from 'lucide-react';

interface BrandCardProps {
  brand: Brand;
  isFeatured?: boolean;
}

export function BrandCard({ brand, isFeatured = false }: BrandCardProps) {
  return (
    <div
      className={`group block p-4 border rounded-lg shadow-sm hover:shadow-md transition-all ${
        isFeatured ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-transparent' : 'border-gray-200'
      }`}
    >
      {isFeatured && (
        <div className="flex items-center gap-1 text-amber-500 mb-2">
          <Star className="w-4 h-4 fill-amber-500" />
          <span className="text-xs font-medium uppercase tracking-wide">Featured</span>
        </div>
      )}
      <Link href={`/brand/${brand.slug}`}>
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-gray-50 mb-3">
          <Image
            src={brand.logo_url}
            alt={brand.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <h3 className="text-base font-medium mb-2 group-hover:text-gray-600 transition-colors">
          {brand.name}
        </h3>
      </Link>
      <Link
        href={`/brand/${brand.slug}`}
        className="inline-block w-full text-center px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-900 rounded-md hover:bg-gray-50 transition-colors"
      >
        Shop {brand.name}
      </Link>
    </div>
  );
}
