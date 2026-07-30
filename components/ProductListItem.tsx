'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Heart } from 'lucide-react';
import { ProductWithVariants } from '@/lib/database.types';
import { useCart } from '@/lib/cart-context';
import { supabasePublic } from '@/lib/supabase/public';
import { useToast } from '@/hooks/use-toast';

interface ProductListItemProps {
  product: ProductWithVariants;
}

export function ProductListItem({ product }: ProductListItemProps) {
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

  return (
    <Link href={`/product/${product.slug}`} className="list-card group">
      {product.is_new && (
        <div className="new-badge">NEW</div>
      )}
      <div className="list-img">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={defaultVariant.images?.[0] || '/placeholder.jpg'}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
        />
      </div>
      <div className="list-info">
        {product.brand && (
          <div className="brand">{product.brand.name}</div>
        )}
        <div className="prod-name">{product.name}</div>
        <div className="stars">
          {hasReviews ? (
            <>
              {'\u2605'.repeat(ratingRounded)}
              <span className="star-empty">{'\u2605'.repeat(5 - ratingRounded)}</span>
              <span className="review-count">({product.review_count!.toLocaleString()})</span>
            </>
          ) : (
            <span className="star-empty">{'\u2605\u2605\u2605\u2605\u2605'}</span>
          )}
        </div>
        <p className="list-desc">{product.description || ''}</p>
      </div>
      <div className="list-pricing">
        <div className="list-price-group">
          <div className="price-label">Retail</div>
          <div className="list-retail">${retailPrice.toFixed(2)}</div>
        </div>
        <div className="list-price-group">
          <div className="price-label">Member Price</div>
          <div className="list-member">
            {memberPrice ? `$${memberPrice.toFixed(2)}` : `$${retailPrice.toFixed(2)}`}
          </div>
        </div>
        {savings > 0 && (
          <span className="list-save">Save ${savings.toFixed(2)}</span>
        )}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWished(!wished); }}
            className={`list-wish-btn${wished ? ' saved' : ''}`}
            aria-label="Add to wishlist"
          >
            <Heart
              className="w-4 h-4"
              style={{
                stroke: wished ? 'var(--coral)' : 'var(--gray)',
                fill: wished ? 'var(--coral)' : 'none',
              }}
            />
          </button>
          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock || isAdding}
            className="list-btn"
          >
            {isOutOfStock ? 'Sold Out' : isAdding ? 'Adding\u2026' : 'Add to Bag'}
          </button>
        </div>
      </div>
    </Link>
  );
}
