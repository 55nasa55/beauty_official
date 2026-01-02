'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CircleCheck as CheckCircle2, ShoppingCart } from 'lucide-react';

export function AddedToCartModal() {
  const { isAddedModalOpen, closeAddedModal, lastAddedItem, items } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!lastAddedItem) return null;

  const handleCheckout = async () => {
    setIsLoading(true);

    try {
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: items,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      if (data.url) {
        closeAddedModal();
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Checkout failed',
        description: error.message || 'Unable to proceed to checkout',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const handleContinueShopping = () => {
    closeAddedModal();
  };

  return (
    <Dialog open={isAddedModalOpen} onOpenChange={closeAddedModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            Added to your cart
          </DialogTitle>
          <DialogDescription>
            Item successfully added to your shopping cart
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-4 py-4">
          <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
            <Image
              src={lastAddedItem.image}
              alt={lastAddedItem.productName}
              fill
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-gray-900 text-sm mb-1">
              {lastAddedItem.productName}
            </h3>
            {lastAddedItem.variantName && (
              <p className="text-xs text-gray-500 mb-2">
                {lastAddedItem.variantName}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-600">
                Qty: {lastAddedItem.quantity}
              </p>
              <p className="font-semibold text-sm text-gray-900">
                ${lastAddedItem.price.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleContinueShopping}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            Continue Shopping
          </Button>
          <Button
            onClick={handleCheckout}
            className="w-full sm:w-auto"
            disabled={isLoading}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isLoading ? 'Processing...' : 'Checkout'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
