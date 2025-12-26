import Link from 'next/link';
import Image from 'next/image';
import { ProductWithVariants } from '@/lib/database.types';
import { AddToCartButton } from './AddToCartButton';

interface ProductCardProps {
  product: ProductWithVariants;
}

export function ProductCard({ product }: ProductCardProps) {
  const defaultVariant = product.variants[0];

  if (!defaultVariant) return null;

  // Only show discount UI when compare_at_price is greater than both 0 AND the actual price
  const hasDiscount =
    defaultVariant.compare_at_price > 0 &&
    defaultVariant.compare_at_price > defaultVariant.price;

  return (
    <div className="group">
      <Link href={`/product/${product.slug}`}>
        <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100 mb-3">
          <Image
            src={defaultVariant.images[0] || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.is_new && (
            <span className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1 rounded">
              New
            </span>
          )}
          {hasDiscount && (
            <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
              Sale
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-col gap-1.5">
        {product.brand && (
          <Link
            href={`/brand/${product.brand.slug}`}
            className="text-xs text-black uppercase tracking-wide font-semibold hover:underline inline-block"
          >
            {product.brand.name}
          </Link>
        )}
        <Link href={`/product/${product.slug}`}>
          <h3 className="text-sm font-normal line-clamp-2 group-hover:text-gray-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <p className={`text-sm font-medium ${hasDiscount ? 'text-red-600' : ''}`}>
              ${defaultVariant.price.toFixed(2)}
            </p>
            {hasDiscount && (
              <p className="text-xs text-gray-400 line-through">
                ${defaultVariant.compare_at_price.toFixed(2)}
              </p>
            )}
          </div>
          <AddToCartButton
            variantId={defaultVariant.id}
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            variantName={defaultVariant.name}
            price={defaultVariant.price}
            image={defaultVariant.images[0] || '/placeholder.jpg'}
            stock={defaultVariant.stock}
          />
        </div>
      </div>
    </div>
  );
}
