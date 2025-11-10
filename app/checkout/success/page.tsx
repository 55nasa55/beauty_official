'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Category, Brand, Collection } from '@/lib/database.types';
import { CheckCircle, Package, MapPin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Order {
  id: string;
  stripe_session_id: string;
  status: string;
  total_amount: number;
  currency: string;
  shipping_address: any;
  billing_address: any;
  items: any[];
  created_at: string;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [categoriesResult, brandsResult, collectionsResult] =
        await Promise.all([
          supabase.from('categories').select('*').order('name'),
          supabase.from('brands').select('*').order('name'),
          supabase
            .from('collections')
            .select('*')
            .eq('display_on_home', true)
            .order('sort_order'),
        ]);

      setCategories(categoriesResult.data || []);
      setBrands(brandsResult.data || []);
      setCollections(collectionsResult.data || []);

      if (sessionId) {
        const { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (orderData) {
          setOrder(orderData as Order);
        }
      }

      setLoading(false);
    }

    fetchData();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1 bg-gray-50">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-light tracking-wide mb-2">
              Order Confirmed!
            </h1>
            <p className="text-gray-600">
              Thank you for your purchase. Your order has been received.
            </p>
          </div>

          {order ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Order Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">{order.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium capitalize">{order.status}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-medium pt-4 border-t">
                    <span>Total:</span>
                    <span>
                      ${order.total_amount.toFixed(2)} {order.currency.toUpperCase()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {order.items && order.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Items Ordered
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {order.items.map((item: any, index: number) => (
                        <div
                          key={index}
                          className="flex justify-between items-center py-3 border-b last:border-0"
                        >
                          <div>
                            <p className="font-medium text-sm">{item.product_name}</p>
                            <p className="text-xs text-gray-500">
                              Quantity: {item.quantity}
                            </p>
                          </div>
                          <p className="font-medium">${item.price.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {order.shipping_address && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 space-y-1">
                      {order.shipping_address.line1 && (
                        <p>{order.shipping_address.line1}</p>
                      )}
                      {order.shipping_address.line2 && (
                        <p>{order.shipping_address.line2}</p>
                      )}
                      <p>
                        {order.shipping_address.city}, {order.shipping_address.state}{' '}
                        {order.shipping_address.postal_code}
                      </p>
                      <p>{order.shipping_address.country}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {order.billing_address && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg font-medium flex items-center gap-2">
                      <CreditCard className="w-5 h-5" />
                      Billing Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 space-y-1">
                      {order.billing_address.line1 && (
                        <p>{order.billing_address.line1}</p>
                      )}
                      {order.billing_address.line2 && (
                        <p>{order.billing_address.line2}</p>
                      )}
                      <p>
                        {order.billing_address.city}, {order.billing_address.state}{' '}
                        {order.billing_address.postal_code}
                      </p>
                      <p>{order.billing_address.country}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-gray-600 mb-4">
                  We couldn't find your order details.
                </p>
                <p className="text-sm text-gray-500">
                  If you just completed your purchase, please wait a moment and refresh
                  the page.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex gap-4 justify-center mt-8">
            <Link href="/">
              <Button variant="outline">Continue Shopping</Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
