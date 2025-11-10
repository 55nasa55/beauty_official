import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id,
          { expand: ['data.price.product'] }
        );

        const items = lineItems.data.map((item) => ({
          product_name: (item.price?.product as Stripe.Product)?.name || 'Unknown',
          variant_name: item.description || '',
          quantity: item.quantity || 1,
          price: (item.amount_total || 0) / 100,
          price_id: item.price?.id,
          product_id: (item.price?.product as any)?.metadata?.product_id,
          variant_id: (item.price?.product as any)?.metadata?.variant_id,
        }));

        const sessionWithDetails = session as any;

        const shippingAddress = sessionWithDetails.shipping_details?.address
          ? {
              line1: sessionWithDetails.shipping_details.address.line1,
              line2: sessionWithDetails.shipping_details.address.line2,
              city: sessionWithDetails.shipping_details.address.city,
              state: sessionWithDetails.shipping_details.address.state,
              postal_code: sessionWithDetails.shipping_details.address.postal_code,
              country: sessionWithDetails.shipping_details.address.country,
              name: sessionWithDetails.shipping_details.name,
            }
          : null;

        const billingAddress = sessionWithDetails.customer_details?.address
          ? {
              line1: sessionWithDetails.customer_details.address.line1,
              line2: sessionWithDetails.customer_details.address.line2,
              city: sessionWithDetails.customer_details.address.city,
              state: sessionWithDetails.customer_details.address.state,
              postal_code: sessionWithDetails.customer_details.address.postal_code,
              country: sessionWithDetails.customer_details.address.country,
            }
          : null;

        const taxAmount = (sessionWithDetails.total_details?.amount_tax || 0) / 100;

        const orderData = {
          user_id: session.metadata?.user_id || null,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent as string,
          status: session.payment_status === 'paid' ? 'paid' : 'pending',
          total_amount: (session.amount_total || 0) / 100,
          tax_amount: taxAmount,
          currency: session.currency || 'usd',
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          items: items,
          tax_details: sessionWithDetails.total_details?.breakdown || null,
        };

        const { error: insertError } = await (supabase as any).from('orders').insert(orderData);

        if (insertError) {
          console.error('Error inserting order:', insertError);
          return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
          );
        }

        console.log('Order created for session:', session.id, 'with status:', orderData.status);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const { error: updateError } = await (supabase as any)
          .from('orders')
          .update({ status: 'paid' })
          .eq('stripe_payment_intent', paymentIntent.id);

        if (updateError) {
          console.error('Error updating order status to paid:', updateError);
        } else {
          console.log('Order updated to paid for payment intent:', paymentIntent.id);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;

        const { error: refundError } = await (supabase as any)
          .from('orders')
          .update({
            status: 'refunded',
            refund_date: new Date().toISOString(),
          })
          .eq('stripe_payment_intent', charge.payment_intent as string);

        if (refundError) {
          console.error('Error updating order status to refunded:', refundError);
        } else {
          console.log('Order refunded for charge:', charge.id);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
