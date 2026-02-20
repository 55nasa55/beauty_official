'use client';

import { useCart } from '@/lib/cart-context';
import { X, Minus, Plus, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabasePublic } from '@/lib/supabase/public';

interface StockInfo {
  variantId: string;
  liveStock: number;
  trackInventory: boolean;
}

export function MiniCart() {
  const { items, removeItem, updateQuantity, totalItems, totalPrice } = useCart();
  const [isLoading, setIsLoading] = useState(false);
  const [stockInfo, setStockInfo] = useState<StockInfo[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && items.length > 0) {
      fetchStockInfo();
    }
  }, [isOpen, items]);

  const fetchStockInfo = async () => {
    try {
      const variantIds = items.map(item => item.variantId);
      const result = await supabasePublic
        .from('product_variants')
        .select('id, stock_quantity, track_inventory')
        .in('id', variantIds);

      if (result.data) {
        const typedData = result.data as Array<{
          id: string;
          stock_quantity: number;
          track_inventory: boolean;
        }>;

        setStockInfo(
          typedData.map(v => ({
            variantId: v.id,
            liveStock: v.stock_quantity,
            trackInventory: v.track_inventory,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching stock info:', error);
    }
  };

  const getStockStatus = (variantId: string, cartQty: number) => {
    const stock = stockInfo.find(s => s.variantId === variantId);
    if (!stock || !stock.trackInventory) return null;

    if (stock.liveStock === 0) {
      return { type: 'error', message: 'Out of stock — remove to continue checkout' };
    }

    if (cartQty > stock.liveStock) {
      return { type: 'warning', message: `Only ${stock.liveStock} left — reduce quantity` };
    }

    return null;
  };

  const hasStockIssues = items.some(item => {
    const status = getStockStatus(item.variantId, item.quantity);
    return status?.type === 'error' || status?.type === 'warning';
  });

  const handleCheckout = async () => {
    if (hasStockIssues) {
      toast({
        title: 'Cannot proceed',
        description: 'Please fix stock issues before checkout.',
        variant: 'destructive',
      });
      return;
    }

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

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 hover:bg-gray-50 rounded-full transition-colors">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-5 h-5 flex items-center justify-center rounded-full">
              {totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Shopping Cart ({totalItems})</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-gray-500 mb-4">Your cart is empty</p>
            <Link href="/">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto py-6 space-y-4">
              {items.map((item) => {
                const stockStatus = getStockStatus(item.variantId, item.quantity);
                return (
                  <div key={item.variantId} className="flex gap-4 border-b pb-4">
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        className="object-cover rounded"
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/product/${item.productSlug}`}
                        className="text-sm font-medium hover:text-gray-600 line-clamp-2"
                      >
                        {item.productName}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">{item.variantName}</p>
                      <p className="text-sm font-medium mt-1">${(item.price * item.quantity).toFixed(2)}</p>

                      {stockStatus && (
                        <div className={`flex items-center gap-1 mt-2 text-xs ${stockStatus.type === 'error' ? 'text-red-600' : 'text-orange-600'}`}>
                          <AlertCircle className="w-3 h-3" />
                          <span>{stockStatus.message}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-sm w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="p-1 hover:bg-gray-100 rounded h-fit"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between text-lg font-medium">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <Button
                className="w-full"
                onClick={handleCheckout}
                disabled={isLoading || hasStockIssues}
              >
                {isLoading ? 'Processing...' : 'Checkout'}
              </Button>
              {hasStockIssues && (
                <p className="text-xs text-red-600 text-center">
                  Fix stock issues to continue
                </p>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
