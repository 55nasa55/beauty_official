interface Order {
  id: string;
  order_number: string;
  customer_email?: string;
  customer_name?: string;
  shipping_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  billing_address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
}

interface OrderItem {
  id: string;
  order_id: string;
  product_id?: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  quantity: number;
  price: number;
}

interface VeeqoOrderPayload {
  deliver_to: {
    first_name: string;
    last_name: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state?: string;
    zip: string;
    country: string;
    phone?: string;
    email: string;
  };
  line_items: Array<{
    sellable_id: number;
    quantity: number;
    price: number;
  }>;
  channel_id: number;
  warehouse_id?: number;
  customer: {
    email: string;
    first_name: string;
    last_name: string;
  };
  number?: string;
}

export function buildVeeqoOrder(
  order: Order,
  orderItems: OrderItem[],
  options: {
    warehouseId?: number;
    channelId: number;
  }
): VeeqoOrderPayload {
  const shippingAddress = order.shipping_address || {};
  const customerName = order.customer_name || '';
  const [firstName, ...lastNameParts] = customerName.split(' ');
  const lastName = lastNameParts.join(' ') || firstName;

  const veeqoOrder: VeeqoOrderPayload = {
    deliver_to: {
      first_name: firstName || 'Guest',
      last_name: lastName || 'Customer',
      address1: shippingAddress.line1 || '',
      address2: shippingAddress.line2,
      city: shippingAddress.city || '',
      state: shippingAddress.state,
      zip: shippingAddress.postal_code || '',
      country: shippingAddress.country || 'US',
      email: order.customer_email || '',
    },
    line_items: orderItems.map((item) => ({
      sellable_id: parseInt(item.variant_id || item.product_id || '0'),
      quantity: item.quantity,
      price: parseFloat(item.price.toString()),
    })),
    channel_id: options.channelId,
    customer: {
      email: order.customer_email || '',
      first_name: firstName || 'Guest',
      last_name: lastName || 'Customer',
    },
    number: order.order_number,
  };

  if (options.warehouseId) {
    veeqoOrder.warehouse_id = options.warehouseId;
  }

  return veeqoOrder;
}
