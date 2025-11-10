'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { ShoppingBag, Package, CreditCard, MapPin, Eye } from 'lucide-react';

interface Order {
  id: string;
  stripe_session_id: string;
  stripe_payment_intent: string;
  status: string;
  total_amount: number;
  currency: string;
  shipping_address: any;
  billing_address: any;
  items: any[];
  refund_date: string | null;
  created_at: string;
}

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const { toast } = useToast();

  const showNewOrderToast = useCallback(
    (order: Order) => {
      toast({
        title: 'New Order Received',
        description: `Order #${order.id.slice(0, 8)} - $${order.total_amount.toFixed(2)}`,
      });
    },
    [toast]
  );

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const newOrder = payload.new as Order;
          setOrders((currentOrders) => [newOrder, ...currentOrders]);
          showNewOrderToast(newOrder);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          const updatedOrder = payload.new as Order;
          setOrders((currentOrders) =>
            currentOrders.map((order) =>
              order.id === updatedOrder.id ? updatedOrder : order
            )
          );

          setSelectedOrder((current) =>
            current?.id === updatedOrder.id ? updatedOrder : current
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          setOrders((currentOrders) =>
            currentOrders.filter((order) => order.id !== (payload.old as any).id)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [showNewOrderToast]);

  async function fetchOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setOrders(data);
    }

    setIsLoading(false);
  }

  const handleMarkAsShipped = async (orderId: string) => {
    try {
      // @ts-expect-error - Supabase type compatibility
      const { error } = await supabase.from('orders').update({ status: 'shipped' }).eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Order marked as shipped',
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRefund = async (order: Order) => {
    if (!confirm('Are you sure you want to refund this order? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_intent: order.stripe_payment_intent,
          order_id: order.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process refund');
      }

      toast({
        title: 'Success',
        description: 'Refund processed successfully',
      });

      fetchOrders();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const viewOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'refunded':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading orders...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-light tracking-wide mb-2">Orders</h1>
          <p className="text-gray-600">Manage customer orders and refunds</p>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">Order #{order.id.slice(0, 8)}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                      <p className="text-lg font-semibold mt-2">
                        ${order.total_amount.toFixed(2)} {order.currency.toUpperCase()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewOrderDetails(order)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {order.status === 'paid' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsShipped(order.id)}
                        >
                          <Package className="w-4 h-4 mr-1" />
                          Mark Shipped
                        </Button>
                      )}
                      {(order.status === 'paid' || order.status === 'shipped') && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRefund(order)}
                        >
                          Refund
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Items:</p>
                    <ul className="space-y-1">
                      {order.items.map((item: any, index: number) => (
                        <li key={index}>
                          {item.product_name} × {item.quantity} - ${item.price.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Order Information</h3>
                <div className="space-y-1 text-sm">
                  <p><span className="text-gray-600">Order ID:</span> {selectedOrder.id}</p>
                  <p><span className="text-gray-600">Session ID:</span> {selectedOrder.stripe_session_id}</p>
                  <p><span className="text-gray-600">Payment Intent:</span> {selectedOrder.stripe_payment_intent}</p>
                  <p><span className="text-gray-600">Status:</span> <span className="capitalize">{selectedOrder.status}</span></p>
                  <p><span className="text-gray-600">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                  {selectedOrder.refund_date && (
                    <p><span className="text-gray-600">Refunded On:</span> {new Date(selectedOrder.refund_date).toLocaleString()}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Items Ordered
                </h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-medium">${item.price.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t">
                  <span className="font-semibold">Total:</span>
                  <span className="font-semibold text-lg">
                    ${selectedOrder.total_amount.toFixed(2)} {selectedOrder.currency.toUpperCase()}
                  </span>
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shipping Address
                  </h3>
                  <div className="text-sm bg-gray-50 p-3 rounded">
                    {selectedOrder.shipping_address.line1 && <p>{selectedOrder.shipping_address.line1}</p>}
                    {selectedOrder.shipping_address.line2 && <p>{selectedOrder.shipping_address.line2}</p>}
                    <p>
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}{' '}
                      {selectedOrder.shipping_address.postal_code}
                    </p>
                    <p>{selectedOrder.shipping_address.country}</p>
                  </div>
                </div>
              )}

              {selectedOrder.billing_address && (
                <div>
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Billing Address
                  </h3>
                  <div className="text-sm bg-gray-50 p-3 rounded">
                    {selectedOrder.billing_address.line1 && <p>{selectedOrder.billing_address.line1}</p>}
                    {selectedOrder.billing_address.line2 && <p>{selectedOrder.billing_address.line2}</p>}
                    <p>
                      {selectedOrder.billing_address.city}, {selectedOrder.billing_address.state}{' '}
                      {selectedOrder.billing_address.postal_code}
                    </p>
                    <p>{selectedOrder.billing_address.country}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </>
  );
}
