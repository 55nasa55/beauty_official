import { Resend } from 'resend';
import { generateOrderConfirmationEmail } from './emailTemplates/confirmation';
import { generateShippingNotificationEmail } from './emailTemplates/tracking';
import { generateDeliveryNotificationEmail } from './emailTemplates/delivered';

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderItem {
  product_name: string;
  product_image?: string;
  quantity: number;
  price: number;
}

interface Order {
  order_number: string;
  public_order_number: number;
  customer_name: string;
  customer_email: string;
  shipping_address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  total: number;
  id?: string;
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, '')
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

export async function sendOrderConfirmationEmail(
  order: Order,
  items: OrderItem[]
) {
  try {
    const html = generateOrderConfirmationEmail(order, items);
    const text = htmlToPlainText(html);

    const result = await resend.emails.send({
      from: 'Cosmetic Club <orders@cosclubusa.com>',
      to: order.customer_email,
      subject: `Order Confirmation - #${order.order_number}`,
      html,
      text,
    });

    return result;
  } catch (error) {
    console.error('Failed to send order confirmation email:', error);
    throw error;
  }
}

export async function sendTrackingEmail(
  order: Order,
  trackingNumber: string,
  carrier?: string
) {
  try {
    const displayOrderNumber = `COS-${order.public_order_number}`;

    const html = generateShippingNotificationEmail({
      order_number: displayOrderNumber,
      customer_name: order.customer_name,
      tracking_number: trackingNumber,
    });
    const text = htmlToPlainText(html);

    const result = await resend.emails.send({
      from: 'Cosmetic Club <orders@cosclubusa.com>',
      to: order.customer_email,
      subject: `Your Order Has Shipped - #${displayOrderNumber}`,
      html,
      text,
    });

    return result;
  } catch (error) {
    console.error('Failed to send tracking email:', error);
    throw error;
  }
}

export async function sendDeliveredEmail(order: Order) {
  try {
    const displayOrderNumber = `COS-${order.public_order_number}`;

    const html = generateDeliveryNotificationEmail({
      order_number: displayOrderNumber,
      customer_name: order.customer_name,
      order_id: order.id,
    });
    const text = htmlToPlainText(html);

    const result = await resend.emails.send({
      from: 'Cosmetic Club <orders@cosclubusa.com>',
      to: order.customer_email,
      subject: `Your Order Has Been Delivered - #${displayOrderNumber}`,
      html,
      text,
    });

    return result;
  } catch (error) {
    console.error('Failed to send delivery email:', error);
    throw error;
  }
}
