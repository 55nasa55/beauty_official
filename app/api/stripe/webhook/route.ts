import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        }));

        const shippingAddress = (session as any).shipping_details?.address || null;
        const billingAddress = (session as any).customer_details?.address || null;

        const { error: insertError } = await supabase.from('orders').insert({
          user_id: session.metadata?.user_id || null,
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent as string,
          status: 'pending',
          total_amount: (session.amount_total || 0) / 100,
          currency: session.currency || 'usd',
          shipping_address: shippingAddress,
          billing_address: billingAddress,
          items: items,
        });

        if (insertError) {
          console.error('Error inserting order:', insertError);
          return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
          );
        }

        console.log('Order created for session:', session.id);
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        const { error: updateError } = await supabase
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

        const { error: refundError } = await supabase
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
