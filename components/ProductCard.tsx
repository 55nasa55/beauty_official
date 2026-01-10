"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ProductWithVariants } from '@/lib/database.types';
import { AddToCartButton } from './AddToCartButton';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/browser';
import { formatCents, getMemberPriceRange, getSavingsRange } from '@/lib/pricing';

interface ProductCardProps {
  product: ProductWithVariants;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const [isMember, setIsMember] = useState(false);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (user) {
      checkMembership();
    }
  }, [user]);

  const checkMembership = async () => {
    if (!user) return;

    const { data: membership } = await supabase
      .from('memberships')
      .select('status, current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();

    if (membership) {
      const isActive = ['active', 'trialing'].includes(membership.status);
      const notExpired = membership.current_period_end && new Date(membership.current_period_end) > new Date();
      setIsMember(isActive && notExpired);
    }
  };

  const defaultVariant = product.variants[0];

  if (!defaultVariant) return null;

  const memberPriceRange = getMemberPriceRange(product.variants);
  const savingsRange = getSavingsRange(product.variants);
  const hasMemberPrice = memberPriceRange !== null;

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
          {hasMemberPrice && memberPriceRange && savingsRange && (
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
              {!user && (
                <Link href="/login?redirect=/pricing" className="text-xs text-blue-600 hover:underline">
                  Log in
                </Link>
              )}
              {user && !isMember && (
                <Link href="/pricing" className="text-xs text-blue-600 hover:underline">
                  Join
                </Link>
              )}
              {user && isMember && (
                <span className="text-xs text-green-600">Member price applied</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
