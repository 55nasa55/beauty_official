'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { supabasePublic } from '@/lib/supabase/public';
import { useToast } from '@/hooks/use-toast';

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
  const { toast } = useToast();
  const [isChecking, setIsChecking] = useState(false);

  const isOutOfStock = stock <= 0;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isOutOfStock) return;
    if (isChecking) return;

    setIsChecking(true);

    try {
      const result = await supabasePublic
        .from('product_variants')
        .select('stock_quantity, track_inventory')
        .eq('id', variantId)
        .maybeSingle();

      if (result.error || !result.data) {
        toast({
          title: 'Error',
          description: 'Product variant not found.',
          variant: 'destructive',
        });
        return;
      }

      const variant = result.data as { stock_quantity: number; track_inventory: boolean };

      if (variant.track_inventory) {
        if (variant.stock_quantity === 0) {
          toast({
            title: 'Out of Stock',
            description: 'This item is currently out of stock.',
            variant: 'destructive',
          });
          return;
        }

        if (1 > variant.stock_quantity) {
          toast({
            title: 'Limited Stock',
            description: `Only ${variant.stock_quantity} left in stock.`,
            variant: 'destructive',
          });
          return;
        }
      }

      addItem({
        variantId,
        productId,
        productName,
        productSlug,
        variantName,
        price,
        image,
      });
    } catch (error) {
      console.error('Error checking stock:', error);
      toast({
        title: 'Error',
        description: 'Failed to add item to cart.',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Button
      size="sm"
      onClick={handleAddToCart}
      disabled={isOutOfStock || isChecking}
      className="h-8 text-xs"
      title={isOutOfStock ? 'Out of stock' : 'Add to cart'}
    >
      {isOutOfStock ? (
        'Sold out'
      ) : isChecking ? (
        'Checking...'
      ) : (
        <>
          <ShoppingCart className="h-3 w-3 mr-1" />
          Add
        </>
      )}
    </Button>
  );
}
