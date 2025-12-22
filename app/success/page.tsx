'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { CheckCircle2, Package, MapPin, CreditCard, Loader2, Receipt, Truck } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

type OrderItem = {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  order_number: string;
  user_id: string | null;
  stripe_session_id: string;
  stripe_payment_intent: string | null;
  status: string;
  payment_status: string;
  shipping_status: string;
  tracking_number: string | null;
  total_amount: number;
  tax_amount: number;
  currency: string;
  customer_email: string | null;
  customer_name: string | null;
  shipping_address: any;
  billing_address: any;
  created_at: string;
};

type ProductVariant = {
  id: string;
  images: string[];
  sku: string | null;
};

type EnrichedOrderItem = OrderItem & {
  variant?: ProductVariant;
};

export default function SuccessPage() {
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<EnrichedOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!sessionId) {
      setError('No session ID provided. Please check your order confirmation email.');
      setLoading(false);
      return;
    }

    fetchOrder();
  }, [mounted, sessionId]);

  const fetchOrder = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      console.log('[Success] Fetching order for session:', sessionId);

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', sessionId)
        .maybeSingle();

      if (orderError) {
        console.error('[Success] Error fetching order:', orderError);
        throw new Error('Failed to load order. Please try again.');
      }

      if (!orderData) {
        console.error('[Success] Order not found for session:', sessionId);
        throw new Error('Order not found. Your payment was successful, but we couldn\'t load the order details. Please contact support@goodlooks.com with your session ID.');
      }

      const order = orderData as Order;
      console.log('[Success] ✓ Order found:', order.id);
      setOrder(order);

      console.log('[Success] Fetching order items for order:', order.id);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', order.id);

      if (itemsError) {
        console.error('[Success] Error fetching order items:', itemsError);
        throw new Error('Failed to load order items.');
      }

      console.log('[Success] ✓ Order items found:', itemsData?.length || 0);

      if (!itemsData || itemsData.length === 0) {
        console.warn('[Success] No order items found');
        setOrderItems([]);
        setLoading(false);
        return;
      }

      const variantIds = itemsData
        .map((item: any) => item.variant_id)
        .filter((id): id is string => id !== null);

      if (variantIds.length > 0) {
        console.log('[Success] Fetching variant details for', variantIds.length, 'variants');

        const { data: variantsData, error: variantsError } = await supabase
          .from('product_variants')
          .select('id, images, sku')
          .in('id', variantIds);

        if (variantsError) {
          console.error('[Success] Error fetching variants:', variantsError);
        } else {
          console.log('[Success] ✓ Variants loaded:', variantsData?.length || 0);

          const variantsMap = new Map<string, ProductVariant>();
          (variantsData || []).forEach((v: any) => {
            variantsMap.set(v.id, v);
          });

          const enrichedItems: EnrichedOrderItem[] = (itemsData as OrderItem[]).map((item) => ({
            ...item,
            variant: item.variant_id ? variantsMap.get(item.variant_id) : undefined,
          }));

          setOrderItems(enrichedItems);
          console.log('[Success] ✓ Order load complete');
          setLoading(false);
          return;
        }
      }

      setOrderItems(itemsData as OrderItem[]);
      console.log('[Success] ✓ Order load complete (no variants)');
      setLoading(false);
    } catch (err: any) {
      console.error('[Success] Failed to fetch order:', err);
      setError(err.message || 'Failed to load order details. Please try refreshing the page.');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getItemImage = (item: EnrichedOrderItem): string => {
    if (item.variant?.images && item.variant.images.length > 0) {
      return item.variant.images[0];
    }
    return '/placeholder-product.jpg';
  };

  const getItemSKU = (item: EnrichedOrderItem): string | null => {
    return item.variant?.sku || null;
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <div className="mb-6">
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-green-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-3 text-gray-900">Loading Your Order</h2>
          <p className="text-gray-600">
            Your payment was successful! Loading your order details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Unable to Load Order</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-2">
            <button
              onClick={() => {
                setLoading(true);
                setError(null);
                fetchOrder();
              }}
              className="w-full bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="block w-full border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Return to Home
            </Link>
          </div>
          {sessionId && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Session ID:</strong>
                <br />
                <code className="text-xs break-all">{sessionId}</code>
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Please save this ID and contact support at support@goodlooks.com if you need assistance.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!order) {
    return null;
  }

  const subtotal = order.total_amount - order.tax_amount;

  return (
    <div className="min-h-screen bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 sm:px-8 sm:py-10 text-center">
            <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Payment Successful!</h1>
            <p className="text-green-50 text-base sm:text-lg">
              {order.customer_name ? `Thank you, ${order.customer_name}!` : 'Thank you for your purchase!'}
            </p>
            {order.customer_email && (
              <p className="text-green-50 text-sm mt-2">
                Confirmation email sent to {order.customer_email}
              </p>
            )}
          </div>

          <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 pb-4 border-b gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="text-base sm:text-lg font-semibold break-all">{order.order_number.slice(0, 16).toUpperCase()}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-sm text-gray-500">Order Date</p>
                  <p className="text-base sm:text-lg font-semibold">{formatDate(order.created_at)}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    order.payment_status === 'paid'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  Payment: {order.payment_status}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Shipping: {order.shipping_status}
                </span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg sm:text-xl font-semibold">Order Items</h2>
              </div>
              <div className="space-y-4">
                {orderItems.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">No items found</p>
                ) : (
                  orderItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 sm:gap-4 py-4 border-b last:border-b-0"
                    >
                      <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        <Image
                          src={getItemImage(item)}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 text-sm sm:text-base">{item.product_name}</h3>
                        {item.variant_name && (
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">{item.variant_name}</p>
                        )}
                        {getItemSKU(item) && (
                          <p className="text-xs text-gray-400 mt-1">SKU: {getItemSKU(item)}</p>
                        )}
                        <div className="flex items-center gap-3 sm:gap-4 mt-2">
                          <p className="text-xs sm:text-sm text-gray-600">Qty: {item.quantity}</p>
                          <p className="text-xs sm:text-sm font-medium text-gray-900">
                            {formatCurrency(item.price, order.currency)} each
                          </p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-gray-900 text-sm sm:text-base">
                          {formatCurrency(item.price * item.quantity, order.currency)}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mb-8">
              <div className="space-y-2 py-4 border-t border-b">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">{formatCurrency(subtotal, order.currency)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">{formatCurrency(order.tax_amount, order.currency)}</span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-bold pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount, order.currency)}</span>
                </div>
              </div>
            </div>

            <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {order.shipping_address && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg sm:text-xl font-semibold">Shipping Address</h2>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {order.shipping_address.name && (
                      <p className="font-medium mb-1 text-sm sm:text-base">{order.shipping_address.name}</p>
                    )}
                    <p className="text-gray-600 text-sm">{order.shipping_address.line1}</p>
                    {order.shipping_address.line2 && (
                      <p className="text-gray-600 text-sm">{order.shipping_address.line2}</p>
                    )}
                    <p className="text-gray-600 text-sm">
                      {order.shipping_address.city}, {order.shipping_address.state}{' '}
                      {order.shipping_address.postal_code}
                    </p>
                    <p className="text-gray-600 text-sm">{order.shipping_address.country}</p>
                  </div>
                </div>
              )}

              {order.billing_address && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg sm:text-xl font-semibold">Billing Address</h2>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600 text-sm">{order.billing_address.line1}</p>
                    {order.billing_address.line2 && (
                      <p className="text-gray-600 text-sm">{order.billing_address.line2}</p>
                    )}
                    <p className="text-gray-600 text-sm">
                      {order.billing_address.city}, {order.billing_address.state}{' '}
                      {order.billing_address.postal_code}
                    </p>
                    <p className="text-gray-600 text-sm">{order.billing_address.country}</p>
                  </div>
                </div>
              )}
            </div>

            {order.tracking_number && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Truck className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg sm:text-xl font-semibold">Tracking Information</h2>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Tracking Number:</strong> {order.tracking_number}
                  </p>
                </div>
              </div>
            )}

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg sm:text-xl font-semibold">Payment Information</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
                  <span className="text-gray-600 text-sm">Payment Method</span>
                  <span className="font-medium text-sm">Credit Card (Stripe)</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="text-gray-600 text-sm">Transaction ID</span>
                  <span className="text-xs sm:text-sm text-gray-500 font-mono break-all">
                    {order.stripe_session_id.slice(-12).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>What's next?</strong> Your order is being prepared for shipment. You'll
                receive a shipping confirmation email with tracking information within 2-3 business
                days.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/"
                className="flex-1 bg-black text-white text-center px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors"
              >
                Continue Shopping
              </Link>
              <button
                onClick={() => window.print()}
                className="flex-1 border border-gray-300 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
