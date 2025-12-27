'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/app/providers';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';

interface Order {
  id: string;
  order_number: string;
  created_at: string;
  payment_status: string;
  shipping_status: string;
  total_amount: number;
  currency: string;
  order_items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  price: number;
}

export default function AccountPage() {
  const router = useRouter();
  const supabase = useSupabase();
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrderItems = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('id, product_name, variant_name, quantity, price')
        .eq('order_id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, order_items: data || [] }
          : order
      ));
    } catch (error) {
      console.error('Error loading order items:', error);
    }
  };

  const handleToggleOrder = async (orderId: string) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null);
    } else {
      setExpandedOrder(orderId);
      const order = orders.find(o => o.id === orderId);
      if (order && !order.order_items) {
        await loadOrderItems(orderId);
      }
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-light tracking-wide mb-2">My Account</h1>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <Button onClick={handleSignOut} variant="outline">
              Sign Out
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-light tracking-wide mb-6">Order History</h2>

          {orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 mb-4">No orders yet</p>
              <Link href="/">
                <Button>Start Shopping</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div
                    className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleToggleOrder(order.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium">
                            Order #{order.order_number.slice(0, 8)}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            order.payment_status === 'paid'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}>
                            {order.payment_status}
                          </span>
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                            {order.shipping_status}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">
                          {format(new Date(order.created_at), 'MMMM d, yyyy')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${order.total_amount.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {expandedOrder === order.id && order.order_items && (
                    <div className="p-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium mb-3">Order Items</h3>
                      <div className="space-y-2">
                        {order.order_items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-center text-sm"
                          >
                            <div>
                              <p className="font-medium">{item.product_name}</p>
                              {item.variant_name && (
                                <p className="text-xs text-gray-600">
                                  {item.variant_name}
                                </p>
                              )}
                              <p className="text-xs text-gray-600">
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <p className="font-medium">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
