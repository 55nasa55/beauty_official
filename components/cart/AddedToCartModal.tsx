'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/lib/cart-context';
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
  const router = useRouter();
  const { isAddedModalOpen, closeAddedModal, lastAddedItem } = useCart();

  if (!lastAddedItem) return null;

  const handleViewCart = () => {
    closeAddedModal();
    router.push('/cart');
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
          >
            Continue Shopping
          </Button>
          <Button
            onClick={handleViewCart}
            className="w-full sm:w-auto"
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            View Cart
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
