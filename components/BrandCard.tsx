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
    <Link
      href={`/brand/${brand.slug}`}
      className={`group block p-6 border rounded-lg hover:shadow-lg transition-all ${
        isFeatured ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-transparent' : ''
      }`}
    >
      {isFeatured && (
        <div className="flex items-center gap-1 text-amber-500 mb-3">
          <Star className="w-4 h-4 fill-amber-500" />
          <span className="text-xs font-medium uppercase tracking-wide">Featured</span>
        </div>
      )}
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-50 mb-4">
        <Image
          src={brand.logo_url}
          alt={brand.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <h3 className="text-lg font-medium mb-2 group-hover:text-gray-600 transition-colors">
        {brand.name}
      </h3>
      <p className="text-sm text-gray-600 line-clamp-2">{brand.description}</p>
    </Link>
  );
}
