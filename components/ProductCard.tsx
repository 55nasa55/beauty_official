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
  const hasReviews = (product.review_count ?? 0) > 0 && product.average_rating;
  const ratingRounded = hasReviews ? Math.round(product.average_rating!) : 0;

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

  // ---- Compact variant (hero mini-cards, not part of approved HTML) ----
  if (variant === 'compact') {
    return (
      <Link href={`/product/${product.slug}`} className="product-card-compact group">
        {savings > 0 && (
          <div className="badge savings-badge product-card-compact__badge" style={{ fontSize: 9, padding: '3px 8px' }}>
            Save ${savings.toFixed(0)}
          </div>
        )}
        <div className="product-card-compact__image">
          <Image src={defaultVariant.images?.[0] || '/placeholder.jpg'} alt={product.name} fill className="object-cover" />
        </div>
        {product.brand && (
          <div className="brand" style={{ fontSize: 8 }}>{product.brand.name}</div>
        )}
        <div className="product-name" style={{ fontSize: 10, height: 'auto', marginBottom: 4, marginTop: 2 }}>
          {product.name}
        </div>
        <div className="product-card-compact__pricing">
          <div className="product-card-compact__pricing-col--left">
            <span className="price-label" style={{ fontSize: 8, marginBottom: 2 }}>Retail</span>
            <span className="strike-price" style={{ fontSize: 9 }}>${retailPrice.toFixed(2)}</span>
          </div>
          <div className="product-card-compact__pricing-col--right">
            <span className="price-label" style={{ fontSize: 8, marginBottom: 2 }}>Member</span>
            <div className="member-price-val" style={{ fontSize: 12 }}>
              {memberPrice ? `${memberPrice.toFixed(2)}` : `${retailPrice.toFixed(2)}`}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // ---- Default variant — direct conversion of approved HTML ----
  return (
    <Link href={`/product/${product.slug}`} className="product-card group">
      {/* badge savings-badge */}
      {savings > 0 && (
        <div className="badge savings-badge">Save ${savings.toFixed(2)}</div>
      )}

      {/* badge badge-new — shown when no savings badge */}
      {product.is_new && savings === 0 && (
        <div className="badge badge-new">NEW</div>
      )}

      {/* wish-btn */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWished(!wished); }}
        className="wish-btn"
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

      {/* product-image */}
      <div className="product-image">
        <Image
          src={defaultVariant.images?.[0] || '/placeholder.jpg'}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* brand */}
      {product.brand && (
        <div className="brand">{product.brand.name}</div>
      )}

      {/* product-name */}
      <div className="product-name">{product.name}</div>

      {/* stars */}
      <div className="stars">
        {hasReviews ? (
          <>
            {'★'.repeat(ratingRounded)}
            <span className="star-empty">{'★'.repeat(5 - ratingRounded)}</span>
            <span className="review-count">({product.review_count!.toLocaleString()})</span>
          </>
        ) : (
          <span className="star-empty">★★★★★</span>
        )}
      </div>

      {/* pricing-container */}
      <div className="pricing-container">
        <div className="price-col retail">
          <span className="price-label">Retail</span>
          <span className="strike-price">${retailPrice.toFixed(2)}</span>
        </div>
        <div className="price-col member">
          <span className="price-label">Member Price</span>
          <div className="member-price-val">
            {memberPrice ? `$${memberPrice.toFixed(2)}` : `$${retailPrice.toFixed(2)}`}
          </div>
        </div>
      </div>

      {/* btn-add */}
      <button
        onClick={handleAddToCart}
        disabled={isOutOfStock || isAdding}
        className="btn-add"
      >
        {isOutOfStock ? 'Sold Out' : isAdding ? 'Adding…' : 'Add to Bag'}
      </button>
    </Link>
  );
}
