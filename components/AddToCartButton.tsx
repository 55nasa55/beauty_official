'use client';

import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';

interface AddToCartButtonProps {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantName: string;
  price: number;
  image: string;
  stock: number;
}

export function AddToCartButton({
  variantId,
  productId,
  productName,
  productSlug,
  variantName,
  price,
  image,
  stock,
}: AddToCartButtonProps) {
  const { addItem } = useCart();

  const isOutOfStock = stock <= 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;

    addItem({
      variantId,
      productId,
      productName,
      productSlug,
      variantName,
      price,
      image,
    });
  };

  return (
    <Button
      size="sm"
      onClick={handleAddToCart}
      disabled={isOutOfStock}
      className="h-8 text-xs"
      title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
    >
      {isOutOfStock ? (
        'Sold out'
      ) : (
        <>
          <ShoppingCart className="h-3 w-3 mr-1" />
          Add
        </>
      )}
    </Button>
  );
}
