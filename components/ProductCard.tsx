"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ProductWithVariants } from '@/lib/database.types';
import { AddToCartButton } from './AddToCartButton';
import { useAuth } from '@/lib/auth-context';
import { useMembership } from '@/lib/membership-context';
import { formatCents, getMemberPriceRange, getSavingsRange } from '@/lib/pricing';

interface ProductCardProps {
  product: ProductWithVariants;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { isMember, loading } = useMembership();

  const defaultVariant = product.variants[0];

  if (!defaultVariant) return null;

  const memberPriceRange = getMemberPriceRange(product.variants);
  const savingsRange = getSavingsRange(product.variants);
  const hasMemberPrice = memberPriceRange !== null;

  const memberPrice = defaultVariant.member_price_cents ? defaultVariant.member_price_cents / 100 : null;
  const displayPrice = !loading && isMember && memberPrice ? memberPrice : defaultVariant.price;
  const savings = memberPrice ? defaultVariant.price - memberPrice : 0;

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
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className={`text-sm font-medium ${!loading && isMember && memberPrice ? 'text-blue-600' : hasDiscount ? 'text-red-600' : ''}`}>
                ${displayPrice.toFixed(2)}
              </p>
              {hasDiscount && (loading || !isMember) && (
                <p className="text-xs text-gray-400 line-through">
                  ${defaultVariant.compare_at_price.toFixed(2)}
                </p>
              )}
              {!loading && isMember && memberPrice && (
                <span className="text-xs text-gray-400 line-through">
                  ${defaultVariant.price.toFixed(2)}
                </span>
              )}
            </div>
            <AddToCartButton
              variantId={defaultVariant.id}
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              variantName={defaultVariant.name}
              price={displayPrice}
              image={defaultVariant.images[0] || '/placeholder.jpg'}
              stock={defaultVariant.stock}
            />
          </div>
          {hasMemberPrice && !loading && !isMember && memberPriceRange && savingsRange && (
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-medium text-blue-600">
                {memberPriceRange.single ? (
                  `Member: ${formatCents(memberPriceRange.min)}`
                ) : (
                  `Member: ${formatCents(memberPriceRange.min)}–${formatCents(memberPriceRange.max)}`
                )}
              </p>
              <span className="text-xs text-gray-500">
                {savingsRange.single ? (
                  `(save ${formatCents(savingsRange.min)})`
                ) : (
                  `(save ${formatCents(savingsRange.min)}–${formatCents(savingsRange.max)})`
                )}
              </span>
              {!user ? (
                <Link
                  href={`/login?redirect=${encodeURIComponent(`/product/${product.slug}`)}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Log in
                </Link>
              ) : (
                <Link href="/pricing" className="text-xs text-blue-600 hover:underline">
                  Join Now
                </Link>
              )}
            </div>
          )}
          {!loading && isMember && memberPrice && savings > 0 && (
            <p className="text-xs text-green-600 font-medium">
              Member savings: ${savings.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
