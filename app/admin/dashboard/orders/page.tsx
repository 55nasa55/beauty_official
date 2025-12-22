'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Package, CreditCard, MapPin, Eye, Truck, Loader2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Order {
  id: string;
  order_number: string;
  user_id?: string | null;
  stripe_session_id?: string;
  stripe_payment_intent?: string | null;
  payment_status: string;
  shipping_status: string;
  tracking_number: string | null;
  total_amount: number;
  tax_amount: number;
  currency: string;
  customer_email: string | null;
  customer_name: string | null;
  shipping_address?: any;
  billing_address?: any;
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authStatus, setAuthStatus] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingStatus, setShippingStatus] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const { toast } = useToast();

  const [page, setPage] = useState(0);
  const [pageSize] = useState(25);
  const [total, setTotal] = useState(0);
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [shippingStatusFilter, setShippingStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [dateRange, setDateRange] = useState('all');

  useEffect(() => {
    loadOrders();
  }, [page, pageSize, paymentStatusFilter, shippingStatusFilter, searchQuery, dateRange]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setPage(0);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  async function loadOrders() {
    try {
      setIsLoading(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setAuthStatus("No session token (not logged in).");
        setIsLoading(false);
        return;
      }

      // Verify admin access first
      const meRes = await fetch('/api/admin/me', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (meRes.status === 401 || meRes.status === 403) {
        const text = await meRes.text().catch(() => "");
        setAuthStatus(`Admin check failed: ${meRes.status}. Body: ${text}`);
        setIsLoading(false);
        return;
      }

      if (!meRes.ok) {
        const text = await meRes.text().catch(() => "");
        setAuthStatus(`Admin check failed: ${meRes.status}. Body: ${text}`);
        setIsLoading(false);
        return;
      }

      setAuthStatus("OK (admin verified). Loading orders...");

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: pageSize.toString(),
      });

      if (paymentStatusFilter && paymentStatusFilter !== 'all') {
        params.append('payment_status', paymentStatusFilter);
      }

      if (shippingStatusFilter && shippingStatusFilter !== 'all') {
        params.append('shipping_status', shippingStatusFilter);
      }

      if (searchQuery) {
        params.append('q', searchQuery);
      }

      const { from, to } = getDateRange(dateRange);
      if (from) params.append('from', from);
      if (to) params.append('to', to);

      const response = await fetch(`/api/admin/orders/list?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        const text = await response.text().catch(() => "");
        setAuthStatus(`Orders fetch failed: ${response.status}. Body: ${text}`);
        setIsLoading(false);
        return;
      }

      const json = await response.json();

      if (!response.ok) {
        console.error('[Orders List] API error:', json);
        setAuthStatus(`Orders fetch failed: ${response.status}. Error: ${json.error || 'Unknown error'}`);
        setIsLoading(false);
        return;
      }

      setOrders(json.orders || []);
      setTotal(json.total || 0);
      setAuthStatus(null);
    } catch (error: any) {
      console.error('[Orders List] Error:', error);
      setAuthStatus(`Error: ${error?.message || String(error)}`);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load orders',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  function getDateRange(range: string): { from: string; to: string } {
    const now = new Date();
    const from = new Date();

    switch (range) {
      case 'last7':
        from.setDate(now.getDate() - 7);
        return { from: from.toISOString(), to: now.toISOString() };
      case 'last30':
        from.setDate(now.getDate() - 30);
        return { from: from.toISOString(), to: now.toISOString() };
      case 'last90':
        from.setDate(now.getDate() - 90);
        return { from: from.toISOString(), to: now.toISOString() };
      default:
        return { from: '', to: '' };
    }
  }

  const handleUpdateShipping = async () => {
    if (!selectedOrder) return;

    if (!trackingNumber.trim() && !shippingStatus) {
      toast({
        title: 'No Changes',
        description: 'Please enter tracking number or select shipping status',
      });
      return;
    }

    try {
      setIsUpdating(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast({
          title: 'Error',
          description: 'No session token. Please log in again.',
          variant: 'destructive',
        });
        return;
      }

      const res = await fetch('/api/admin/orders/update-shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          tracking_number: trackingNumber || null,
          shipping_status: shippingStatus || null,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        toast({
          title: 'Error',
          description: 'Not authorized. Please log in again.',
          variant: 'destructive',
        });
        return;
      }

      const json = await res.json();

      if (!res.ok) {
        console.error('[Shipping Update] API error:', json);
        throw new Error(json.error || 'Failed to update shipping');
      }

      const updatedOrder = json.order;

      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
        )
      );

      setSelectedOrder((prev) =>
        prev ? { ...prev, ...updatedOrder } : prev
      );

      toast({
        title: 'Success',
        description: 'Shipping information updated',
      });

      setIsDetailDialogOpen(false);
      setTrackingNumber('');
      setShippingStatus('');
      loadOrders();
    } catch (error: any) {
      console.error('[Shipping Update] Error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRefund = async (order: Order | OrderWithItems) => {
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
      setIsRefunding(true);

      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast({
          title: 'Error',
          description: 'No session token. Please log in again.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/stripe/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_intent: order.stripe_payment_intent,
          order_id: order.id,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        toast({
          title: 'Error',
          description: 'Not authorized. Please log in again.',
          variant: 'destructive',
        });
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('[Refund] API error:', data);
        throw new Error(data.error || 'Failed to process refund');
      }

      const updatedOrder = data.order;

      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === updatedOrder.id
            ? { ...o, payment_status: 'refunded' }
            : o
        )
      );

      if (selectedOrder?.id === updatedOrder.id) {
        setSelectedOrder((prev) =>
          prev ? { ...prev, payment_status: 'refunded' } : prev
        );
      }

      toast({
        title: 'Success',
        description: 'Refund processed successfully',
      });

      loadOrders();
    } catch (error: any) {
      console.error('[Refund] Error:', error);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsRefunding(false);
    }
  };

  const viewOrderDetails = async (order: Order) => {
    setIsDetailDialogOpen(true);
    setIsLoadingDetails(true);
    setSelectedOrder(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        toast({
          title: 'Error',
          description: 'No session token. Please log in again.',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch(`/api/admin/orders/${order.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401 || response.status === 403) {
        toast({
          title: 'Error',
          description: 'Not authorized. Please log in again.',
          variant: 'destructive',
        });
        return;
      }

      const json = await response.json();

      if (!response.ok) {
        console.error('[Order Details] API error:', json);
        throw new Error(json.error || 'Failed to load order details');
      }

      const orderWithItems: OrderWithItems = {
        ...json.order,
        items: json.items || [],
        itemCount: json.itemCount || 0,
      };

      setSelectedOrder(orderWithItems);
      setTrackingNumber(orderWithItems.tracking_number || '');
      setShippingStatus(orderWithItems.shipping_status || '');
    } catch (error: any) {
      console.error('[Order Details] Error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load order details',
        variant: 'destructive',
      });
      setIsDetailDialogOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const resetFilters = () => {
    setPaymentStatusFilter('all');
    setShippingStatusFilter('all');
    setSearchInput('');
    setSearchQuery('');
    setDateRange('all');
    setPage(0);
  };

  const totalPages = Math.ceil(total / pageSize);
  const showingFrom = total === 0 ? 0 : page * pageSize + 1;
  const showingTo = Math.min((page + 1) * pageSize, total);

  return (
    <div className="space-y-6">
      {authStatus && (
        <div className="mb-4 rounded border p-3 text-sm bg-yellow-50 border-yellow-200">
          <p className="font-semibold text-yellow-800 mb-1">Auth Status:</p>
          <p className="text-yellow-700">{authStatus}</p>
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold tracking-tight">Orders Management</h2>
        <p className="text-muted-foreground">View and manage customer orders</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Order #, email, name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="pl-9"
                />
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1 h-7 w-7 p-0"
                    onClick={() => setSearchInput('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-status">Payment Status</Label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger id="payment-status">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipping-status">Shipping Status</Label>
              <Select value={shippingStatusFilter} onValueChange={setShippingStatusFilter}>
                <SelectTrigger id="shipping-status">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-range">Date Range</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger id="date-range">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="last7">Last 7 Days</SelectItem>
                  <SelectItem value="last30">Last 30 Days</SelectItem>
                  <SelectItem value="last90">Last 90 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={resetFilters}>
              Reset Filters
            </Button>
            <p className="text-sm text-muted-foreground">
              Showing {showingFrom}–{showingTo} of {total} orders
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : orders.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No orders found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-lg">
                            Order #{order.order_number.slice(0, 12)}
                          </h3>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.payment_status === 'paid'
                                ? 'bg-green-100 text-green-800'
                                : order.payment_status === 'refunded'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {order.payment_status}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              order.shipping_status === 'delivered'
                                ? 'bg-green-100 text-green-800'
                                : order.shipping_status === 'shipped'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {order.shipping_status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium">
                          {order.currency.toUpperCase()} {(order.total_amount / 100).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Customer:</span>
                        <span className="font-medium">{order.customer_name || order.customer_email}</span>
                      </div>
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
                      {order.payment_status === 'paid' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRefund(order)}
                          disabled={isRefunding}
                        >
                          {isRefunding ? 'Processing...' : 'Refund'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {order.tracking_number && (
                    <div className="mt-3 pt-3 border-t lg:border-t-0 lg:border-l lg:pl-6 lg:mt-0 lg:pt-0">
                      <div className="flex items-center gap-2 text-sm">
                        <Truck className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600">Tracking:</span>
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {order.tracking_number}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages || 1}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page >= totalPages - 1}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
          </DialogHeader>

          {isLoadingDetails ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Order Number</p>
                  <p className="font-medium">{selectedOrder.order_number}</p>
                </div>
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Payment Status</p>
                  <p className="font-medium capitalize">{selectedOrder.payment_status}</p>
                </div>
                <div>
                  <p className="text-gray-600">Shipping Status</p>
                  <p className="font-medium capitalize">{selectedOrder.shipping_status}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-3">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-medium">{selectedOrder.customer_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Email</p>
                    <p className="font-medium">{selectedOrder.customer_email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div>
                  <h3 className="font-medium mb-3">Shipping Address</h3>
                  <p className="text-sm">
                    {selectedOrder.shipping_address.line1}
                    {selectedOrder.shipping_address.line2 && `, ${selectedOrder.shipping_address.line2}`}
                    <br />
                    {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state}{' '}
                    {selectedOrder.shipping_address.postal_code}
                    <br />
                    {selectedOrder.shipping_address.country}
                  </p>
                </div>
              )}

              <div>
                <h3 className="font-medium mb-3">Order Items ({selectedOrder.itemCount})</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex gap-4 p-3 border rounded-lg">
                      {item.variant?.images && item.variant.images.length > 0 ? (
                        <Image
                          src={item.variant.images[0]}
                          alt={item.product_name}
                          width={60}
                          height={60}
                          className="rounded object-cover"
                        />
                      ) : (
                        <div className="w-[60px] h-[60px] bg-gray-100 rounded flex items-center justify-center">
                          <Package className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product_name}</h4>
                        {item.variant_name && (
                          <p className="text-sm text-gray-600">{item.variant_name}</p>
                        )}
                        {item.variant?.sku && (
                          <p className="text-xs text-gray-500">SKU: {item.variant.sku}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {selectedOrder.currency.toUpperCase()} {(item.price / 100).toFixed(2)}
                        </p>
                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">
                      {selectedOrder.currency.toUpperCase()}{' '}
                      {((selectedOrder.total_amount - selectedOrder.tax_amount) / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">
                      {selectedOrder.currency.toUpperCase()} {(selectedOrder.tax_amount / 100).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total</span>
                    <span>
                      {selectedOrder.currency.toUpperCase()} {(selectedOrder.total_amount / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="font-medium mb-4">Update Shipping Information</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tracking">Tracking Number</Label>
                    <Input
                      id="tracking"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Shipping Status</Label>
                    <Select value={shippingStatus} onValueChange={setShippingStatus}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="processing">Processing</SelectItem>
                        <SelectItem value="shipped">Shipped</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleUpdateShipping} disabled={isUpdating} className="w-full">
                    {isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      'Update Shipping'
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
                    disabled={isRefunding}
                    className="w-full"
                  >
                    {isRefunding ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing Refund...
                      </>
                    ) : (
                      'Process Refund'
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Failed to load order details
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
