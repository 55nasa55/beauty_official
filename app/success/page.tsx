'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, Package, MapPin, CreditCard, Loader2, Receipt } from 'lucide-react';
import Link from 'next/link';

type Order = {
  id: string;
  stripe_session_id: string;
  status: string;
  total_amount: number;
  tax_amount: number;
  currency: string;
  customer_email?: string;
  customer_name?: string;
  shipping_address: any;
  billing_address?: any;
  items: any[];
  created_at: string;
};

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('session_id');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Processing your order...');

  useEffect(() => {
    if (!sessionId) {
      setError('No session ID provided');
      setLoading(false);
      return;
    }

    createAndFetchOrder();
  }, [sessionId]);

  const createAndFetchOrder = async () => {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);
      setStatusMessage('Creating your order...');

      console.log('[Success Page] Creating order for session:', sessionId);

      // Step 1: Create the order immediately via API
      const createResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        console.error('[Success Page] Error creating order:', errorData);

        // If order creation failed, still try to fetch it (might exist from webhook)
        if (errorData.error === 'Order already exists' || errorData.orderId) {
          console.log('[Success Page] Order already exists, fetching...');
          setStatusMessage('Loading your order...');
        } else {
          throw new Error(errorData.error || 'Failed to create order');
        }
      } else {
        const createData = await createResponse.json();
        console.log('[Success Page] Order created:', createData);
        setStatusMessage('Loading your order details...');
      }

      // Step 2: Fetch the order from Supabase with exponential backoff
      await fetchOrderWithRetry();
    } catch (err: any) {
      console.error('[Success Page] Error in createAndFetchOrder:', err);
      setError(err.message || 'Failed to process order');
      setLoading(false);
    }
  };

  const fetchOrderWithRetry = async () => {
    if (!sessionId) return;

    const maxRetries = 10;
    const baseDelay = 500; // Start with 500ms
    let attempt = 0;

    const tryFetch = async (): Promise<boolean> => {
      attempt++;
      console.log(`[Success Page] Fetch attempt ${attempt}/${maxRetries}`);

      try {
        const { data, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (fetchError) {
          console.error('[Success Page] Error fetching order:', fetchError);
          throw fetchError;
        }

        if (data) {
          console.log('[Success Page] Order found:', (data as any).id);
          setOrder(data as any);
          setLoading(false);
          return true;
        }

        // Order not found yet
        if (attempt >= maxRetries) {
          console.error('[Success Page] Order not found after max retries');
          throw new Error(
            'Order is being processed. Please check your email for confirmation or contact support with your payment confirmation.'
          );
        }

        // Calculate exponential backoff delay
        const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1), 5000); // Max 5 seconds
        console.log(`[Success Page] Order not found, retrying in ${delay}ms...`);
        setStatusMessage(`Waiting for order to sync... (${attempt}/${maxRetries})`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return await tryFetch();
      } catch (err: any) {
        if (attempt >= maxRetries) {
          throw err;
        }

        const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1), 5000);
        console.log(`[Success Page] Error, retrying in ${delay}ms...`, err);
        setStatusMessage(`Retrying... (${attempt}/${maxRetries})`);

        await new Promise((resolve) => setTimeout(resolve, delay));
        return await tryFetch();
      }
    };

    try {
      await tryFetch();
    } catch (err: any) {
      console.error('[Success Page] Failed to fetch order:', err);
      setError(err.message || 'Failed to load order details');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-4">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-gray-600" />
          <h2 className="text-2xl font-semibold mb-3 text-gray-900">{statusMessage}</h2>
          <p className="text-gray-600">
            This usually takes just a few seconds. Please don't close this page.
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
                createAndFetchOrder();
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
                <code className="text-xs">{sessionId}</code>
              </p>
              <p className="text-xs text-blue-700 mt-2">
                Save this ID for customer support if needed.
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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 sm:px-8 sm:py-10 text-center">
            <CheckCircle2 className="w-16 h-16 text-white mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Order Confirmed!</h1>
            <p className="text-green-50 text-lg">
              {order.customer_name ? `Thank you, ${order.customer_name}!` : 'Thank you for your purchase'}
            </p>
            {order.customer_email && (
              <p className="text-green-50 text-sm mt-2">
                A confirmation email has been sent to {order.customer_email}
              </p>
            )}
          </div>

          <div className="px-6 py-6 sm:px-8">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4 pb-4 border-b">
                <div>
                  <p className="text-sm text-gray-500">Order Number</p>
                  <p className="text-lg font-semibold">{order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="text-lg font-semibold">{formatDate(order.created_at)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                  order.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {order.status === 'paid' ? 'Paid' : 'Processing'}
                </span>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold">Order Items</h2>
              </div>
              <div className="space-y-4">
                {Array.isArray(order.items) && order.items.map((item: any, index: number) => (
                  <div key={index} className="flex justify-between items-start py-4 border-b last:border-b-0">
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      {item.variant_name && (
                        <p className="text-sm text-gray-500">{item.variant_name}</p>
                      )}
                      <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-semibold">
                      {formatCurrency(item.price, order.currency)}
                    </p>
                  </div>
                ))}
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
                <div className="flex justify-between text-lg font-bold pt-2">
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
                    <h2 className="text-xl font-semibold">Shipping Address</h2>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {order.shipping_address.name && (
                      <p className="font-medium mb-1">{order.shipping_address.name}</p>
                    )}
                    <p className="text-gray-600">{order.shipping_address.line1}</p>
                    {order.shipping_address.line2 && (
                      <p className="text-gray-600">{order.shipping_address.line2}</p>
                    )}
                    <p className="text-gray-600">
                      {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                    </p>
                    <p className="text-gray-600">{order.shipping_address.country}</p>
                  </div>
                </div>
              )}

              {order.billing_address && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="w-5 h-5 text-gray-600" />
                    <h2 className="text-xl font-semibold">Billing Address</h2>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-600">{order.billing_address.line1}</p>
                    {order.billing_address.line2 && (
                      <p className="text-gray-600">{order.billing_address.line2}</p>
                    )}
                    <p className="text-gray-600">
                      {order.billing_address.city}, {order.billing_address.state} {order.billing_address.postal_code}
                    </p>
                    <p className="text-gray-600">{order.billing_address.country}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-gray-600" />
                <h2 className="text-xl font-semibold">Payment Information</h2>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium">Credit Card (Stripe)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transaction ID</span>
                  <span className="text-sm text-gray-500 font-mono">
                    {order.stripe_session_id.slice(-12).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800">
                <strong>What's next?</strong> You'll receive an email confirmation shortly.
                Your order will be processed and shipped within 2-3 business days.
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
