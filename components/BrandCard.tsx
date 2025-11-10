import Link from 'next/link';
import Image from 'next/image';
import { Brand } from '@/lib/database.types';

interface BrandCardProps {
  brand: Brand;
}

export function BrandCard({ brand }: BrandCardProps) {
  return (
    <Link
      href={`/brand/${brand.slug}`}
      className="group block p-6 border rounded-lg hover:shadow-lg transition-shadow"
    >
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
