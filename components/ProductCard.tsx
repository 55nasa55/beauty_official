"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ProductWithVariants } from '@/lib/database.types';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useMembership } from '@/lib/membership-context';
import { supabasePublic } from '@/lib/supabase/public';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Heart } from 'lucide-react';

interface ProductCardProps {
  product: ProductWithVariants;
  variant?: 'default' | 'compact';
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-0.5 mb-2">
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.floor(rating);
        const half = !filled && rating >= i - 0.5;
        return (
          <span
            key={i}
            className="text-[11px]"
            style={{ color: filled || half ? '#f59e0b' : '#E0E0E0' }}
          >
            {filled ? '★' : half ? '★' : '★'}
          </span>
        );
      })}
      {count > 0 && (
        <span className="text-[10px] text-gray ml-1.5">({count.toLocaleString()})</span>
      )}
    </div>
  );
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const { user } = useAuth();
  const { isMember, loading } = useMembership();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [wished, setWished] = useState(false);

  const defaultVariant = product.variants?.[0];
  if (!defaultVariant) return null;

  const memberPrice = defaultVariant.member_price_cents
    ? defaultVariant.member_price_cents / 100
    : null;
  const retailPrice = defaultVariant.price;
  const savings = memberPrice ? retailPrice - memberPrice : 0;
  const isOutOfStock = defaultVariant.stock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock || isAdding) return;
    setIsAdding(true);
    try {
      const result = await supabasePublic
        .from('product_variants')
        .select('stock_quantity, track_inventory')
        .eq('id', defaultVariant.id)
        .maybeSingle();
      if (result.error || !result.data) {
        toast({ title: 'Error', description: 'Product not found.', variant: 'destructive' });
        return;
      }
      const v = result.data as { stock_quantity: number; track_inventory: boolean };
      if (v.track_inventory && v.stock_quantity === 0) {
        toast({ title: 'Out of Stock', description: 'Currently out of stock.', variant: 'destructive' });
        return;
      }
      addItem({
        variantId: defaultVariant.id,
        productId: product.id,
        productName: product.name,
        productSlug: product.slug,
        variantName: defaultVariant.name,
        price: defaultVariant.price,
        memberPrice: memberPrice || undefined,
        image: defaultVariant.images?.[0] || '/placeholder.jpg',
      });
    } catch {
      toast({ title: 'Error', description: 'Failed to add item.', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const cardPadding = variant === 'compact' ? 'p-1.5' : 'p-2.5';
  const imageMargin = variant === 'compact'
    ? '-m-1.5 mb-1.5'
    : '-m-2.5 mb-2.5';
  const badgeTextSize = variant === 'compact' ? 'text-[9px]' : 'text-[12px]';
  const badgePadding = variant === 'compact' ? 'px-2 py-0.5' : 'px-3 py-1.5';

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group relative flex flex-col bg-off-white border border-light-gray rounded-card transition-transform duration-200 hover:-translate-y-1 overflow-hidden"
      style={{ boxShadow: '0 0 0 rgba(0,0,0,0)' }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 8px 20px rgba(169,201,236,0.25)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)')}
    >
      {/* Savings badge */}
      {savings > 0 && (
        <div
          className={`absolute z-20 ${badgeTextSize} font-bold ${badgePadding} rounded-savings text-white`}
          style={{
            background: '#FF3366',
            top: '12px',
            left: '12px',
            boxShadow: '0 4px 10px rgba(255,51,102,0.3)',
          }}
        >
          Save ${savings.toFixed(2)}
        </div>
      )}

      {/* New badge */}
      {product.is_new && savings === 0 && (
        <div
          className={`absolute z-20 ${badgeTextSize} font-bold ${badgePadding} rounded-new-badge text-white`}
          style={{ background: 'var(--charcoal)', top: '12px', left: '12px' }}
        >
          NEW
        </div>
      )}

      {/* Wishlist button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setWished(!wished);
        }}
        className={`absolute z-20 w-[34px] h-[34px] rounded-full bg-white border-[1.5px] border-light-gray flex items-center justify-center transition-all hover:border-coral`}
        style={{ top: '12px', right: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        aria-label="Add to wishlist"
      >
        <Heart
          className="w-4 h-4 transition-all"
          style={{
            stroke: wished ? 'var(--coral)' : 'var(--gray)',
            fill: wished ? 'var(--coral)' : 'none',
          }}
        />
      </button>

      {/* Product image */}
      <div className={`relative ${imageMargin} overflow-hidden`} style={{ aspectRatio: '1 / 1' }}>
        <Image
          src={defaultVariant.images?.[0] || '/placeholder.jpg'}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* Card content */}
      <div className={cardPadding}>
        {/* Brand */}
        {product.brand && (
          <div className="text-brand-label mb-0.5">{product.brand.name}</div>
        )}

        {/* Product name */}
        <h3 className="text-product-name mb-1.5 leading-[1.4]">
          {product.name}
        </h3>

        {/* Star rating */}
        {(product.review_count ?? 0) > 0 && product.average_rating && (
          <StarRow rating={product.average_rating} count={product.review_count!} />
        )}

        {/* Transparent pricing UI */}
        <div
          className="flex border-t border-light-gray pt-2 pb-2.5 mt-auto"
        >
          <div className="flex-1 pr-3">
            <span className="text-price-label block mb-1">Retail</span>
            <span className="text-strike-price">${retailPrice.toFixed(2)}</span>
          </div>
          <div className="flex-1 pl-3 border-l border-light-gray">
            <span className="text-price-label block mb-1">Member</span>
            <span className="text-member-price">
              {memberPrice ? `$${memberPrice.toFixed(2)}` : `$${retailPrice.toFixed(2)}`}
            </span>
          </div>
        </div>

        {/* Add to Bag button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          className="w-full py-3.5 rounded-button font-body font-bold text-[15px] bg-baby-blue text-charcoal hover:bg-baby-blue-hover transition-colors disabled:opacity-50"
        >
          {isOutOfStock ? 'Sold Out' : isAdding ? 'Adding…' : 'Add to Bag'}
        </button>
      </div>
    </Link>
  );
}
