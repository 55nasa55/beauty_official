'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Package, CreditCard, MapPin, Eye, Truck, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  stripe_session_id: string;
  stripe_payment_intent: string | null;
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
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  price: number;
}

interface ProductVariant {
  id: string;
  images: string[];
  sku: string | null;
}

interface EnrichedOrderItem extends OrderItem {
  variant?: ProductVariant;
}

interface OrderWithItems extends Order {
  items: EnrichedOrderItem[];
  itemCount: number;
}

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingStatus, setShippingStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    try {
      setIsLoading(true);

      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        setOrders([]);
        setIsLoading(false);
        return;
      }

      const orderIds = ordersData.map((o: any) => o.id);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        throw itemsError;
      }

      const variantIds = (itemsData || [])
        .map((item: any) => item.variant_id)
        .filter((id): id is string => id !== null);

      let variantsMap = new Map<string, ProductVariant>();

      if (variantIds.length > 0) {
        const { data: variantsData, error: variantsError } = await supabase
          .from('product_variants')
          .select('id, images, sku')
          .in('id', variantIds);

        if (!variantsError && variantsData) {
          variantsData.forEach((v: any) => {
            variantsMap.set(v.id, v);
          });
        }
      }

      const itemsByOrderId = new Map<string, EnrichedOrderItem[]>();
      (itemsData || []).forEach((item: any) => {
        const enrichedItem: EnrichedOrderItem = {
          ...item,
          variant: item.variant_id ? variantsMap.get(item.variant_id) : undefined,
        };

        if (!itemsByOrderId.has(item.order_id)) {
          itemsByOrderId.set(item.order_id, []);
        }
        itemsByOrderId.get(item.order_id)!.push(enrichedItem);
      });

      const ordersWithItems: OrderWithItems[] = ordersData.map((order: any) => ({
        ...order,
        items: itemsByOrderId.get(order.id) || [],
        itemCount: (itemsByOrderId.get(order.id) || []).reduce(
          (sum, item) => sum + item.quantity,
          0
        ),
      }));

      setOrders(ordersWithItems);
    } catch (error: any) {
      console.error('Failed to fetch orders:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleUpdateShipping = async () => {
    if (!selectedOrder) return;

    try {
      setIsUpdating(true);

      const updates: Record<string, any> = {};
      if (trackingNumber.trim()) {
        updates.tracking_number = trackingNumber.trim();
      }
      if (shippingStatus) {
        updates.shipping_status = shippingStatus;
      }

      if (Object.keys(updates).length === 0) {
        toast({
          title: 'No Changes',
          description: 'Please enter tracking number or select shipping status',
        });
        return;
      }

      const { error } = (await (supabase as any)
        .from('orders')
        .update(updates)
        .eq('id', selectedOrder.id));

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Shipping information updated',
      });

      setIsDetailDialogOpen(false);
      setTrackingNumber('');
      setShippingStatus('');
      fetchOrders();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefund = async (order: OrderWithItems) => {
    if (!order.stripe_payment_intent) {
      toast({
        title: 'Error',
        description: 'Cannot refund: No payment intent found',
        variant: 'destructive',
      });
      return;
    }

    if (!confirm(`Are you sure you want to refund order ${order.order_number.slice(0, 12)}? This action cannot be undone.`)) {
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

  const viewOrderDetails = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setTrackingNumber(order.tracking_number || '');
    setShippingStatus(order.shipping_status || '');
    setIsDetailDialogOpen(true);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'refunded':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getShippingStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'processing':
        return 'bg-yellow-100 text-yellow-700';
      case 'shipped':
        return 'bg-blue-100 text-blue-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount);
  };

  const getItemImage = (item: EnrichedOrderItem): string => {
    if (item.variant?.images && item.variant.images.length > 0) {
      return item.variant.images[0];
    }
    return '/placeholder-product.jpg';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light tracking-wide mb-2">Orders</h1>
        <p className="text-gray-600">Manage customer orders and shipments</p>
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
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="font-medium">Order #{order.order_number.slice(0, 12).toUpperCase()}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${getPaymentStatusColor(order.payment_status)}`}>
                          {order.payment_status}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${getShippingStatusColor(order.shipping_status)}`}>
                          {order.shipping_status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{new Date(order.created_at).toLocaleString()}</p>
                        {order.customer_name && <p className="font-medium">{order.customer_name}</p>}
                        {order.customer_email && <p>{order.customer_email}</p>}
                        <p className="text-lg font-semibold text-gray-900 mt-2">
                          {formatCurrency(order.total_amount, order.currency)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                    </div>

                    {order.items.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2">
                        {order.items.slice(0, 3).map((item) => (
                          <div
                            key={item.id}
                            className="relative w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden"
                          >
                            <Image
                              src={getItemImage(item)}
                              alt={item.product_name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-16 h-16 flex-shrink-0 bg-gray-200 rounded-lg flex items-center justify-center text-xs text-gray-600 font-medium">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 lg:flex-col">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => viewOrderDetails(order)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {order.payment_status === 'paid' && (
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

                  {order.tracking_number && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Tracking:</span>
                        <span className="font-mono text-xs">{order.tracking_number}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium mb-2">Order Information</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600">Order Number:</span> {selectedOrder.order_number.slice(0, 16).toUpperCase()}</p>
                    <p><span className="text-gray-600">Order ID:</span> <span className="text-xs font-mono">{selectedOrder.id}</span></p>
                    <p><span className="text-gray-600">Date:</span> {new Date(selectedOrder.created_at).toLocaleString()}</p>
                    <p>
                      <span className="text-gray-600">Payment Status:</span>{' '}
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${getPaymentStatusColor(selectedOrder.payment_status)}`}>
                        {selectedOrder.payment_status}
                      </span>
                    </p>
                    <p>
                      <span className="text-gray-600">Shipping Status:</span>{' '}
                      <span className={`inline-block px-2 py-0.5 rounded text-xs ${getShippingStatusColor(selectedOrder.shipping_status)}`}>
                        {selectedOrder.shipping_status}
                      </span>
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Customer Information</h3>
                  <div className="space-y-1 text-sm">
                    {selectedOrder.customer_name && (
                      <p><span className="text-gray-600">Name:</span> {selectedOrder.customer_name}</p>
                    )}
                    {selectedOrder.customer_email && (
                      <p><span className="text-gray-600">Email:</span> {selectedOrder.customer_email}</p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Items Ordered
                </h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="relative w-20 h-20 flex-shrink-0 bg-gray-200 rounded-lg overflow-hidden">
                        <Image
                          src={getItemImage(item)}
                          alt={item.product_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{item.product_name}</p>
                        {item.variant_name && (
                          <p className="text-sm text-gray-500">{item.variant_name}</p>
                        )}
                        {item.variant?.sku && (
                          <p className="text-xs text-gray-400 mt-1">SKU: {item.variant.sku}</p>
                        )}
                        <p className="text-sm text-gray-600 mt-1">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(item.price, selectedOrder.currency)}</p>
                        <p className="text-sm text-gray-500">each</p>
                        <p className="font-semibold mt-1">
                          {formatCurrency(item.price * item.quantity, selectedOrder.currency)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.total_amount - selectedOrder.tax_amount, selectedOrder.currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax:</span>
                    <span>{formatCurrency(selectedOrder.tax_amount, selectedOrder.currency)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.total_amount, selectedOrder.currency)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {selectedOrder.shipping_address && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Shipping Address
                    </h3>
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">
                      {selectedOrder.shipping_address.name && (
                        <p className="font-medium">{selectedOrder.shipping_address.name}</p>
                      )}
                      <p>{selectedOrder.shipping_address.line1}</p>
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
                    <div className="text-sm bg-gray-50 p-3 rounded-lg">
                      <p>{selectedOrder.billing_address.line1}</p>
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

              <div className="border-t pt-6">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipping Management
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="tracking">Tracking Number</Label>
                    <Input
                      id="tracking"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Shipping Status</Label>
                    <select
                      id="status"
                      value={shippingStatus}
                      onChange={(e) => setShippingStatus(e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black"
                    >
                      <option value="">Select status...</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                  <Button
                    onClick={handleUpdateShipping}
                    disabled={isUpdating}
                    className="w-full"
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Shipping Info'
                    )}
                  </Button>
                </div>
              </div>

              {selectedOrder.payment_status === 'paid' && (
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Refund Management</h3>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setIsDetailDialogOpen(false);
                      handleRefund(selectedOrder);
                    }}
                    className="w-full"
                  >
                    Process Refund
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
