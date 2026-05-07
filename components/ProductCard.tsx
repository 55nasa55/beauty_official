"use client";

import Link from 'next/link';
import Image from 'next/image';
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

/* Richer feminine pastels — vivid enough to visually pop */
const cardThemes: { bg: string; innerBg: string; accent: string }[] = [
  { bg: 'linear-gradient(145deg,#fce8ee 0%,#f9d4de 100%)',       innerBg: '#fce8ee', accent: '#e8a0b0' }, // blush pink
  { bg: 'linear-gradient(145deg,#fdebd0 0%,#fad7b5 100%)',       innerBg: '#fdebd0', accent: '#e8b890' }, // warm peach
  { bg: 'linear-gradient(145deg,#ede8f8 0%,#ddd4f4 100%)',       innerBg: '#ede8f8', accent: '#c4aae8' }, // soft lavender
  { bg: 'linear-gradient(145deg,#fef0f4 0%,#fcd8e2 100%)',       innerBg: '#fef0f4', accent: '#f4a0b8' }, // baby pink
  { bg: 'linear-gradient(145deg,#d8f4ec 0%,#c0ebde 100%)',       innerBg: '#d8f4ec', accent: '#80c8b0' }, // mint
  { bg: 'linear-gradient(145deg,#fff0e8 0%,#fddac8 100%)',       innerBg: '#fff0e8', accent: '#f0a890' }, // soft apricot
];

function hashIndex(str: string, len: number) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff;
  return h % len;
}

function HeartIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 01-8 0" />
    </svg>
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const { isMember, loading } = useMembership();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [heartHover, setHeartHover] = useState(false);

  const defaultVariant = product.variants?.[0];
  if (!defaultVariant) return null;

  const memberPriceRange = getMemberPriceRange(product.variants);
  const savingsRange = getSavingsRange(product.variants);
  const hasMemberPrice = memberPriceRange !== null;

  const memberPrice = defaultVariant.member_price_cents ? defaultVariant.member_price_cents / 100 : null;
  const displayPrice = !loading && isMember && memberPrice ? memberPrice : defaultVariant.price;
  const savings = memberPrice ? defaultVariant.price - memberPrice : 0;

  const hasDiscount =
    defaultVariant.compare_at_price > 0 &&
    defaultVariant.compare_at_price > defaultVariant.price;

  const theme = cardThemes[hashIndex(product.id, cardThemes.length)];
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

  return (
    <div className="group flex flex-col card-glow rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1" style={{ background: '#fdf8f5' }}>

      {/* ── Image area ── */}
      <Link href={`/product/${product.slug}`} className="block relative">
        <div
          className="relative overflow-hidden"
          style={{
            background: theme.bg,
            aspectRatio: '4/5',
            borderRadius: '1.5rem 1.5rem 0 0',
          }}
        >
          {/* Subtle inner highlight shimmer */}
          <div
            className="absolute inset-0 pointer-events-none z-10 opacity-30"
            style={{ background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.6) 0%, transparent 60%)' }}
          />

          <Image
            src={defaultVariant.images?.[0] || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-contain p-5 transition-transform duration-500 group-hover:scale-[1.06] z-0"
          />

          {/* Badges — top left */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-20">
            {product.is_new && (
              <span className="text-[9px] uppercase tracking-widest font-bold bg-white/90 text-[#c07888] px-2.5 py-1 rounded-full shadow-sm">
                New
              </span>
            )}
            {hasDiscount && (
              <span className="text-[9px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-full shadow-sm"
                style={{ background: 'linear-gradient(135deg,#f9c0cc,#f090a8)', color: '#fff' }}>
                Sale
              </span>
            )}
          </div>

          {/* Wishlist — top right, always visible on mobile, hover on desktop */}
          <button
            onMouseEnter={() => setHeartHover(true)}
            onMouseLeave={() => setHeartHover(false)}
            onClick={(e) => e.preventDefault()}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-20 transition-all duration-200 md:opacity-0 md:group-hover:opacity-100 md:scale-90 md:group-hover:scale-100 shadow-md"
            style={{
              background: heartHover ? 'linear-gradient(135deg,#fce8ee,#f9d4de)' : 'rgba(255,255,255,0.95)',
              color: heartHover ? '#e07090' : '#d4909e',
              border: '1px solid rgba(244,167,185,0.3)',
            }}
            aria-label="Add to wishlist"
          >
            <HeartIcon />
          </button>
        </div>
      </Link>

      {/* ── Info area ── */}
      <div className="flex flex-col gap-1.5 px-4 pt-3 pb-4">

        {product.brand && (
          <Link
            href={`/brand/${product.brand.slug}`}
            className="text-[9.5px] uppercase tracking-[0.16em] font-bold transition-colors"
            style={{ color: theme.accent }}
          >
            {product.brand.name}
          </Link>
        )}

        <Link href={`/product/${product.slug}`}>
          <h3 className="text-[12.5px] font-medium text-[#3a2a2a] leading-snug line-clamp-2 hover:text-[#c07888] transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Ratings */}
        {(product.review_count ?? 0) > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => {
                const filled = i + 1 <= Math.floor(product.average_rating!);
                const half = !filled && i < product.average_rating! && product.average_rating! < i + 1;
                return (
                  <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" className="w-3 h-3" stroke="currentColor"
                    fill={filled ? '#F4A7B9' : half ? 'url(#halfPink)' : 'none'}>
                    <defs>
                      <linearGradient id="halfPink">
                        <stop offset="50%" stopColor="#F4A7B9" />
                        <stop offset="50%" stopColor="transparent" />
                      </linearGradient>
                    </defs>
                    <path d="M10 2.5l2.933 5.528L19 8.91l-4.4 3.636 1.278 5.545L10 15l-5.878 3.09L5.4 12.545 1 8.91l6.067-.882L10 2.5z"
                      strokeWidth="1" stroke={filled || half ? '#F4A7B9' : '#F9C0CC'} />
                  </svg>
                );
              })}
            </div>
            <Link href={`/product/${product.slug}#reviews`} className="text-[10px] text-[#c4a0a8] hover:text-[#d4707e]">
              ({product.review_count})
            </Link>
          </div>
        )}

        {/* Pricing */}
        <div className="mt-0.5 space-y-0.5">
          <div className="flex items-center gap-1.5">
            <span className={`text-[13px] font-semibold ${!loading && isMember && memberPrice ? 'text-[#d4707e]' : hasDiscount ? 'text-[#d4707e]' : 'text-[#3a2a2a]'}`}>
              ${displayPrice.toFixed(2)}
            </span>
            {hasDiscount && (loading || !isMember) && (
              <span className="text-[11px] text-[#d4b0b8] line-through">${defaultVariant.compare_at_price.toFixed(2)}</span>
            )}
            {!loading && isMember && memberPrice && (
              <span className="text-[11px] text-[#d4b0b8] line-through">${defaultVariant.price.toFixed(2)}</span>
            )}
          </div>

          {hasMemberPrice && !loading && !isMember && memberPriceRange && savingsRange && (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10.5px] font-semibold text-[#d4707e]">
                {memberPriceRange.single
                  ? `Member: ${formatCents(memberPriceRange.min)}`
                  : `Member: ${formatCents(memberPriceRange.min)}–${formatCents(memberPriceRange.max)}`}
              </span>
              <Link
                href={user ? '/pricing' : `/login?redirect=${encodeURIComponent(`/product/${product.slug}`)}`}
                className="text-[10px] text-[#c4909e] hover:text-[#d4707e] underline underline-offset-2"
              >
                {user ? 'Join' : 'Log in'}
              </Link>
            </div>
          )}

          {!loading && isMember && memberPrice && savings > 0 && (
            <span className="text-[9.5px] uppercase tracking-wider font-bold text-emerald-500">
              You save ${savings.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to bag */}
        <button
          onClick={handleAddToCart}
          disabled={isOutOfStock || isAdding}
          className="mt-3 w-full h-10 rounded-2xl text-[11.5px] font-semibold tracking-wide transition-all duration-200 flex items-center justify-center gap-1.5 shadow-sm hover:shadow-md"
          style={isOutOfStock
            ? { background: '#f5e8ec', color: '#c4a0a8', cursor: 'not-allowed' }
            : { background: 'linear-gradient(135deg, #f4b8c8 0%, #e07090 100%)', color: '#fff' }}
        >
          {isOutOfStock ? (
            'Sold Out'
          ) : isAdding ? (
            'Adding…'
          ) : (
            <>
              <BagIcon />
              Add to Bag
            </>
          )}
        </button>
      </div>
    </div>
  );
}
