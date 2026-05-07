"use client";

import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag } from 'lucide-react';
import { ProductWithVariants } from '@/lib/database.types';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { useMembership } from '@/lib/membership-context';
import { formatCents, getMemberPriceRange, getSavingsRange } from '@/lib/pricing';
import { supabasePublic } from '@/lib/supabase/public';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface ProductCardProps {
  product: ProductWithVariants;
}

// Soft pastel backgrounds cycle for cards
const pastelBgs = [
  'bg-rose-50',
  'bg-stone-50',
  'bg-amber-50/60',
  'bg-pink-50',
  'bg-sky-50/50',
  'bg-emerald-50/40',
];

function hashIndex(str: string, len: number) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return h % len;
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { isMember, loading } = useMembership();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);

  const defaultVariant = product.variants?.[0];
  if (!defaultVariant) return null;

  const memberPriceRange = getMemberPriceRange(product.variants);
  const savingsRange = getSavingsRange(product.variants);
  const hasMemberPrice = memberPriceRange !== null;

  const memberPrice = defaultVariant.member_price_cents ? defaultVariant.member_price_cents / 100 : null;
  const displayPrice = !loading && isMember && memberPrice ? memberPrice : defaultVariant.price;

  const hasDiscount =
    defaultVariant.compare_at_price > 0 &&
    defaultVariant.compare_at_price > defaultVariant.price;

  const savings = memberPrice ? defaultVariant.price - memberPrice : 0;

  const bgClass = pastelBgs[hashIndex(product.id, pastelBgs.length)];

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (defaultVariant.stock <= 0 || isAdding) return;
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

  const isOutOfStock = defaultVariant.stock <= 0;

  return (
    <div className="group flex flex-col">
      {/* Image area */}
      <Link href={`/product/${product.slug}`} className="block relative">
        <div className={`relative aspect-[4/5] rounded-2xl overflow-hidden ${bgClass} mb-3`}>
          <Image
            src={defaultVariant.images?.[0] || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-[1.04]"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.is_new && (
              <span className="text-[10px] uppercase tracking-widest font-semibold bg-white/90 text-stone-600 px-2.5 py-1 rounded-full border border-stone-200/60">
                New
              </span>
            )}
            {hasDiscount && (
              <span className="text-[10px] uppercase tracking-widest font-semibold bg-rose-100 text-rose-500 px-2.5 py-1 rounded-full">
                Sale
              </span>
            )}
          </div>

          {/* Wishlist button */}
          <button
            className="absolute top-3 right-3 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-sm border border-stone-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            aria-label="Add to wishlist"
            onClick={(e) => e.preventDefault()}
          >
            <Heart className="w-3.5 h-3.5 text-stone-400" />
          </button>
        </div>
      </Link>

      {/* Info */}
      <div className="flex flex-col gap-1 px-0.5">
        {product.brand && (
          <Link
            href={`/brand/${product.brand.slug}`}
            className="text-[10px] uppercase tracking-widest font-semibold text-stone-400 hover:text-stone-600 transition-colors"
          >
            {product.brand.name}
          </Link>
        )}

        <Link href={`/product/${product.slug}`}>
          <h3 className="text-[13px] font-normal text-stone-700 leading-snug line-clamp-2 hover:text-stone-900 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Ratings */}
        {(product.review_count ?? 0) > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i + 1 <= Math.floor(product.average_rating!);
                const half = !filled && i < product.average_rating! && product.average_rating! < i + 1;
                return (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="w-3 h-3" stroke="currentColor"
                    fill={filled ? '#FBBF24' : half ? 'url(#halfGrad)' : 'none'}>
                    <defs>
                      <linearGradient id="halfGrad">
                        <stop offset="50%" stopColor="#FBBF24" />
                        <stop offset="50%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                    <path d="M10 2.5l2.933 5.528L19 8.91l-4.4 3.636 1.278 5.545L10 15l-5.878 3.09L5.4 12.545 1 8.91l6.067-.882L10 2.5z"
                      strokeWidth="1" stroke={filled || half ? '#FBBF24' : '#E5E7EB'} />
                  </svg>
                );
              })}
            </div>
            <Link href={`/product/${product.slug}#reviews`} className="text-[11px] text-stone-400 hover:text-stone-600">
              ({product.review_count})
            </Link>
          </div>
        )}

        {/* Pricing */}
        <div className="mt-0.5 space-y-0.5">
          <div className="flex items-center gap-2">
            <span className={`text-[13px] font-medium ${!loading && isMember && memberPrice ? 'text-rose-400' : hasDiscount ? 'text-rose-500' : 'text-stone-800'}`}>
              ${displayPrice.toFixed(2)}
            </span>
            {hasDiscount && (loading || !isMember) && (
              <span className="text-[11px] text-stone-300 line-through">${defaultVariant.compare_at_price.toFixed(2)}</span>
            )}
            {!loading && isMember && memberPrice && (
              <span className="text-[11px] text-stone-300 line-through">${defaultVariant.price.toFixed(2)}</span>
            )}
          </div>

          {hasMemberPrice && !loading && !isMember && memberPriceRange && savingsRange && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[11px] text-rose-400 font-medium">
                {memberPriceRange.single
                  ? `Member: ${formatCents(memberPriceRange.min)}`
                  : `Member: ${formatCents(memberPriceRange.min)}–${formatCents(memberPriceRange.max)}`}
              </span>
              <Link
                href={user ? '/pricing' : `/login?redirect=${encodeURIComponent(`/product/${product.slug}`)}`}
                className="text-[11px] text-stone-400 hover:text-stone-600 underline underline-offset-2"
              >
                {user ? 'Join' : 'Log in'}
              </Link>
            </div>
          )}

          {!loading && isMember && memberPrice && savings > 0 && (
            <span className="text-[10px] uppercase tracking-wider text-emerald-500 font-medium">
              You save ${savings.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to cart button */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          className={`mt-3 w-full h-9 rounded-xl text-[12px] font-medium tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5
            ${isOutOfStock
              ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
              : 'bg-rose-300/80 hover:bg-rose-400/90 text-white shadow-sm hover:shadow'
            }`}
        >
          {isOutOfStock ? (
            'Sold Out'
          ) : isAdding ? (
            'Adding...'
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5" />
              Add to Bag
            </>
          )}
        </button>
      </div>
    </div>
  );
}
